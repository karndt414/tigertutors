import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import './GroupTutoring.css';

function GroupTutoring() {
    const [sessions, setSessions] = useState([]);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedSession, setSelectedSession] = useState(null);
    const [showRegistrationForm, setShowRegistrationForm] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [confirmationData, setConfirmationData] = useState(null);
    const [user, setUser] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        fullName: '',
        schoolEmail: '',
        subject: '',
        helpNeeded: '',
        previousPrograms: [],
        acknowledgements: {
            rti: false,
            materials: false
        }
    });

    useEffect(() => {
        checkUser();
        fetchSessions();
    }, []);

    const checkUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        if (user) {
            setFormData(prev => ({
                ...prev,
                schoolEmail: user.email || ''
            }));
        }
    };

    const fetchSessions = async () => {
        const { data, error } = await supabase
            .from('group_tutoring_sessions')
            .select('*')
            .gte('session_date', new Date().toISOString())
            .order('session_date', { ascending: true });

        if (error) console.error(error);
        else setSessions(data || []);
    };

    const getSessionsForDate = (date) => {
        return sessions.filter(session => {
            const sessionDate = new Date(session.session_date);
            return (
                sessionDate.getDate() === date.getDate() &&
                sessionDate.getMonth() === date.getMonth() &&
                sessionDate.getFullYear() === date.getFullYear()
            );
        });
    };

    const getDaysInMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const handleSessionClick = (session) => {
        setSelectedSession(session);
        // Don't auto-fill subject since there are multiple
        setShowRegistrationForm(true);
    };

    const handleFormChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (name.includes('acknowledgements')) {
            const field = name.split('.')[1];
            setFormData(prev => ({
                ...prev,
                acknowledgements: {
                    ...prev.acknowledgements,
                    [field]: checked
                }
            }));
        } else if (type === 'checkbox') {
            setFormData(prev => ({
                ...prev,
                previousPrograms: checked
                    ? [...prev.previousPrograms, value]
                    : prev.previousPrograms.filter(p => p !== value)
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!formData.fullName || !formData.schoolEmail || !formData.subject || !formData.helpNeeded) {
            alert('Please fill in all required fields');
            return;
        }

        if (!formData.acknowledgements.rti || !formData.acknowledgements.materials) {
            alert('Please acknowledge both requirements');
            return;
        }

        try {
            // Save registration to database
            const { data, error } = await supabase
                .from('group_tutoring_registrations')
                .insert({
                    session_id: selectedSession.id,
                    full_name: formData.fullName,
                    school_email: formData.schoolEmail,
                    subject: formData.subject,
                    help_needed: formData.helpNeeded,
                    previous_programs: formData.previousPrograms,
                    registered_at: new Date().toISOString(),
                    room_assignment: selectedSession.room_assignment
                });

            if (error) {
                alert('Error registering: ' + error.message);
                return;
            }

            // Show confirmation with room assignment
            setConfirmationData({
                room: selectedSession.room_assignment,
                date: new Date(selectedSession.session_date).toLocaleDateString('en-US', { 
                    month: '2-digit', 
                    day: '2-digit', 
                    year: 'numeric' 
                }),
                time: selectedSession.session_time,
                email: 'wolfkame@bentonvillek12.org'
            });

            setShowRegistrationForm(false);
            setShowConfirmation(true);

            // Send confirmation email
            await sendConfirmationEmail(formData.schoolEmail, confirmationData);

        } catch (err) {
            console.error('Registration error:', err);
            alert('An error occurred. Please try again.');
        }
    };

    const sendConfirmationEmail = async (email, data) => {
        try {
            // This would call your backend email service
            console.log('Sending confirmation email to:', email);
            // You'll need to set up a backend function for this
        } catch (err) {
            console.error('Email error:', err);
        }
    };

    // Calendar rendering
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

    const calendarDays = [];
    for (let i = 0; i < firstDay; i++) {
        calendarDays.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
        calendarDays.push(i);
    }

    const mathSubjects = ['Pre-AP Geometry', 'Geometry', 'Advanced Algebra 2', 'Algebra 2', 'AP Precalculus'];

    if (showConfirmation) {
        return (
            <div className="group-tutoring">
                <h2 style={{ textAlign: 'center' }}>Group Tutoring</h2>
                <div className="confirmation-container">
                    <h3 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Registration Confirmed!</h3>
                    <div className="confirmation-box">
                        <p className="confirmation-room">{confirmationData.room}</p>
                        <p className="confirmation-detail">{confirmationData.date}</p>
                        <p className="confirmation-detail">{confirmationData.time}</p>
                        <p className="confirmation-action">Sign up in RTI immediately.</p>
                    </div>
                    <p style={{ textAlign: 'center', marginTop: '2rem', color: 'var(--text-secondary)' }}>
                        Thank you for registering for group tutoring. We can't wait to see you! Questions or can't find the flex? Email Meg Wolfka, tutoring coordinator, at <a href={`mailto:${confirmationData.email}`}>{confirmationData.email}</a>.
                    </p>
                    <button onClick={() => {
                        setShowConfirmation(false);
                        setSelectedSession(null);
                        setFormData({
                            fullName: '',
                            schoolEmail: user?.email || '',
                            subject: '',
                            helpNeeded: '',
                            previousPrograms: [],
                            acknowledgements: { rti: false, materials: false }
                        });
                    }} style={{ marginTop: '2rem', display: 'block', margin: '2rem auto 0' }}>
                        Return to Calendar
                    </button>
                </div>
            </div>
        );
    }

    if (showRegistrationForm) {
        return (
            <div className="group-tutoring">
                <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Group Tutoring Registration</h2>
                <form onSubmit={handleFormSubmit} className="registration-form">
                    <div className="form-group">
                        <label>Session *</label>
                        <select 
                            value={selectedSession?.id || ''} 
                            onChange={(e) => {
                                const session = sessions.find(s => s.id === parseInt(e.target.value));
                                if (session) handleSessionClick(session);
                            }}
                            required
                        >
                            <option value="">Select a session</option>
                            {sessions.map(session => (
                                <option key={session.id} value={session.id}>
                                    {new Date(session.session_date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' })}, {session.session_time}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Name (first and last) *</label>
                        <input
                            type="text"
                            name="fullName"
                            placeholder="Enter your full name"
                            value={formData.fullName}
                            onChange={handleFormChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>School email *</label>
                        <input
                            type="email"
                            name="schoolEmail"
                            value={formData.schoolEmail}
                            onChange={handleFormChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Subject *</label>
                        <select
                            name="subject"
                            value={formData.subject}
                            onChange={handleFormChange}
                            required
                        >
                            <option value="">Select a subject</option>
                            {mathSubjects.map(subject => (
                                <option key={subject} value={subject}>{subject}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>How much help do you need? *</label>
                        <div className="radio-group">
                            <label className="radio-label">
                                <input
                                    type="radio"
                                    name="helpNeeded"
                                    value="A lot! I don't understand at all."
                                    checked={formData.helpNeeded === "A lot! I don't understand at all."}
                                    onChange={handleFormChange}
                                    required
                                />
                                A lot! I don't understand at all.
                            </label>
                            <label className="radio-label">
                                <input
                                    type="radio"
                                    name="helpNeeded"
                                    value="Some. I understand some concepts, but I get stuck on lots of problems."
                                    checked={formData.helpNeeded === "Some. I understand some concepts, but I get stuck on lots of problems."}
                                    onChange={handleFormChange}
                                    required
                                />
                                Some. I understand some concepts, but I get stuck on lots of problems.
                            </label>
                            <label className="radio-label">
                                <input
                                    type="radio"
                                    name="helpNeeded"
                                    value="Not much. I mostly understand and can work some homework problems. Or I just want to work and ask questions if I get stuck."
                                    checked={formData.helpNeeded === "Not much. I mostly understand and can work some homework problems. Or I just want to work and ask questions if I get stuck."}
                                    onChange={handleFormChange}
                                    required
                                />
                                Not much. I mostly understand and can work some homework problems. Or I just want to work and ask questions if I get stuck.
                            </label>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>What MATh tutoring programs have you previously participated in?</label>
                        <div className="checkbox-group">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    name="previousPrograms"
                                    value="Previous group tutoring session"
                                    checked={formData.previousPrograms.includes("Previous group tutoring session")}
                                    onChange={handleFormChange}
                                />
                                Previous group tutoring session
                            </label>
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    name="previousPrograms"
                                    value="Previous or ongoing individual tutoring"
                                    checked={formData.previousPrograms.includes("Previous or ongoing individual tutoring")}
                                    onChange={handleFormChange}
                                />
                                Previous or ongoing individual tutoring
                            </label>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                name="acknowledgements.rti"
                                checked={formData.acknowledgements.rti}
                                onChange={handleFormChange}
                                required
                            />
                            A room/teacher will be provided to me once I submit this form. I understand that I must register for this session in RTI in order to attend.
                        </label>
                    </div>

                    <div className="form-group">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                name="acknowledgements.materials"
                                checked={formData.acknowledgements.materials}
                                onChange={handleFormChange}
                                required
                            />
                            I will come prepared with my math materials: notes, homework assignments, etc.
                        </label>
                    </div>

                    <div className="form-buttons">
                        <button type="submit" className="submit-button">Submit Registration</button>
                        <button type="button" onClick={() => setShowRegistrationForm(false)} className="cancel-button">Cancel</button>
                    </div>
                </form>
            </div>
        );
    }

    return (
        <div className="group-tutoring">
            <h2 style={{ textAlign: 'center', marginBottom: '1rem' }}>Group Tutoring</h2>
            
            <div className="group-tutoring-description">
                <p>
                    Group tutoring brings students and tutors together in a math classroom during flex. Once they arrive, students are assigned to a tutor who can help them with their current math class. Either one or two students are assigned to each tutor. Throughout the session, tutors explain concepts, work examples, and help with homework questions. Group tutoring is great for students who are struggling with a specific concept or want a convenient way to ask questions as they work on homework. All math students working on the listed subject are welcome, including those needing significant, consistent help or wanting to see if MATh tutoring is a good fit for them.
                </p>
                <p>
                    If you are seeking long-term individual tutoring, please fill out the form in your math Google Classroom.
                </p>
                <p>
                    Have questions? Email Meg Wolfka, tutoring coordinator, at <a href="mailto:wolfkame@bentonvillek12.org">wolfkame@bentonvillek12.org</a>.
                </p>
                <p className="register-instruction">
                    Register for as many sessions as you would like. Click on a session below to register.
                </p>
            </div>

            <div className="calendar-container">
                <div className="calendar-header">
                    <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))} className="nav-button">← Previous</button>
                    <h3>{monthName}</h3>
                    <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))} className="nav-button">Next →</button>
                </div>

                <div className="calendar-grid">
                    <div className="day-label">Sun</div>
                    <div className="day-label">Mon</div>
                    <div className="day-label">Tue</div>
                    <div className="day-label">Wed</div>
                    <div className="day-label">Thu</div>
                    <div className="day-label">Fri</div>
                    <div className="day-label">Sat</div>

                    {calendarDays.map((day, index) => {
                        const date = day ? new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day) : null;
                        const daySessions = date ? getSessionsForDate(date) : [];

                        return (
                            <div key={index} className={`calendar-day ${!day ? 'empty' : ''}`}>
                                {day && <div className="day-number">{day}</div>}
                                {daySessions.length > 0 && (
                                    <div className="sessions-container">
                                        {daySessions.map(session => (
                                            <button
                                                key={session.id}
                                                className="session-button"
                                                onClick={() => handleSessionClick(session)}
                                                style={{ fontSize: '0.7em', padding: '6px 8px' }}
                                            >
                                                {session.session_time}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export default GroupTutoring;