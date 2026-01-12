import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import ImageUpload from '../ImageUpload';
import './TutorProfilePage.css';

function TutorProfilePage() {
    const [user, setUser] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [tutorProfile, setTutorProfile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    // Form state
    const [name, setName] = useState('');
    const [subjects, setSubjects] = useState('');
    const [photoUrl, setPhotoUrl] = useState('');
    const [photoPreview, setPhotoPreview] = useState('');
    const [selectedSubjects, setSelectedSubjects] = useState([]);
    const [otherSubject, setOtherSubject] = useState('');

    const mathSubjects = ['Algebra 1', 'Geometry', 'Algebra 2', 'Precalculus', 'Calc AB', 'Calc BC', 'Statistics', 'Other'];

    // Add this state
    const [registeredSessions, setRegisteredSessions] = useState([]);

    // Comment out the stats state
    /*
    const [tutorStats, setTutorStats] = useState({
        totalSessions: 0,
        totalStudents: 0,
        upcomingSessions: 0
    });
    */

    useEffect(() => {
        checkUser();
    }, []);

    useEffect(() => {
        if (user && !isEditing && userRole) {
            // Only fetch profile when not in edit mode and user is set
            if (userRole === 'tutor' || userRole === 'admin') {
                fetchTutorProfile(user.id);
            }
        }
    }, [user, userRole, isEditing]);

    // Comment out the stats call in fetchTutorProfile
    const fetchTutorProfile = async (userId) => {
        const { data, error } = await supabase
            .from('tutors')
            .select('*')
            .eq('id', userId)
            .single();

        if (data) {
            setTutorProfile(data);
            setName(data.name || '');
            setPhotoUrl(data.photo || '');
            setPhotoPreview(data.photo || '');
            
            // Parse subjects from the stored string
            if (data.subjects) {
                const subjectsArray = data.subjects.split(', ');
                setSelectedSubjects(subjectsArray);
                setSubjects(data.subjects);
            }
            
            await fetchTutorSessions(userId);
            // await fetchTutorStats();
        } else if (error?.code === 'PGRST116') {
            setIsEditing(true);
        }
    };

    // Keep the session listener separate
    useEffect(() => {
        const handleSessionRegistered = () => {
            if (user) {
                fetchTutorSessions(user.id);
                // Comment out the stats call
                // fetchTutorStats();
            }
        };
        
        window.addEventListener('sessionRegistered', handleSessionRegistered);
        return () => window.removeEventListener('sessionRegistered', handleSessionRegistered);
    }, [user]);

    const checkUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);

        if (user) {
            // Get user role
            const { data: userData } = await supabase
                .from('users')
                .select('role')
                .eq('id', user.id)
                .single();

            if (userData) {
                setUserRole(userData.role);
                
                // If tutor or admin, fetch their tutor profile (if it exists)
                if (userData.role === 'tutor' || userData.role === 'admin') {
                    fetchTutorProfile(user.id);
                }
            }
        }
    };

    // Add this function to fetch tutor's sessions
    const fetchTutorSessions = async (userId) => {
        if (!user?.email) return;
        
        const { data, error } = await supabase
            .from('group_tutoring_registrations')
            .select(`
                *,
                group_tutoring_sessions (
                    id,
                    session_date,
                    session_time,
                    room_assignment,
                    teacher_name
                )
            `)
            .eq('school_email', user.email)
            .order('registered_at', { ascending: false });
        
        if (error) console.error(error);
        else setRegisteredSessions(data || []);
    };

    // Comment out the fetchTutorStats function
    /*
    const fetchTutorStats = async () => {
        if (!user?.email) return;
        
        const { data, error } = await supabase
            .from('group_tutoring_registrations')
            .select(`
                *,
                group_tutoring_sessions (
                    session_date
                )
            `)
            .eq('school_email', user.email);
        
        if (data) {
            const now = new Date();
            const upcoming = data.filter(reg => 
                new Date(reg.group_tutoring_sessions?.session_date) > now
            ).length;
            
            const stats = {
                totalSessions: data.length,
                totalStudents: new Set(data.map(d => d.full_name)).size,
                upcomingSessions: upcoming
            };
            
            setTutorStats(stats);
            
            // Save stats to users table
            await supabase
                .from('users')
                .update({
                    total_sessions: stats.totalSessions,
                    upcoming_sessions: stats.upcomingSessions,
                    total_students: stats.totalStudents
                })
                .eq('id', user.id);
        }
    };
    */

    const handlePhotoUpload = (url) => {
        setPhotoUrl(url);
        setPhotoPreview(url);
    };

    const handleSubjectChange = (subject) => {
        setSelectedSubjects(prev => {
            const updated = prev.includes(subject) 
                ? prev.filter(s => s !== subject)
                : [...prev, subject];
            
            // Clear otherSubject when "Other" is unchecked
            if (subject === 'Other' && !prev.includes('Other')) {
                setOtherSubject('');
            }
            
            return updated;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        // Remove the photo requirement check
        if (selectedSubjects.length === 0) {
            alert('Please select at least one subject.');
            setLoading(false);
            return;
        }

        if (selectedSubjects.includes('Other') && !otherSubject.trim()) {
            alert('Please specify your other subject.');
            setLoading(false);
            return;
        }

        try {
            // Create subjects string
            let subjectsString = selectedSubjects.filter(s => s !== 'Other').join(', ');
            if (selectedSubjects.includes('Other') && otherSubject.trim()) {
                subjectsString = subjectsString ? subjectsString + ', ' + otherSubject : otherSubject;
            }

            if (tutorProfile) {
                const { error } = await supabase
                    .from('tutors')
                    .update({
                        name,
                        subjects: subjectsString,
                        photo: photoUrl || null
                    })
                    .eq('id', tutorProfile.id);

                if (error) {
                    alert('Error updating profile: ' + error.message);
                    setLoading(false);
                } else {
                    alert('Profile updated!');
                    setLoading(false);
                    setIsEditing(false);
                    // Refresh the profile from database
                    await fetchTutorProfile(user.id);
                }
            } else {
                const { error } = await supabase
                    .from('tutors')
                    .insert({
                        id: user.id,
                        name,
                        subjects: subjectsString,
                        photo: photoUrl || null,
                        is_approved: false
                    });

                if (error) {
                    alert('Error creating profile: ' + error.message);
                } else {
                    alert('Profile created!');
                    setIsEditing(false);
                    setOtherSubject(''); // Reset other subject
                    setSelectedSubjects([]); // Reset selected subjects
                    await fetchTutorProfile(user.id);
                }
            }
        } catch (err) {
            console.error('Error:', err);
            alert('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();

        let subject = formData.subject;
        if (formData.subject === 'Other') {
            if (!formData.otherSubject) {
                alert('Please specify your subject');
                return;
            }
            subject = formData.otherSubject;
        }

        if (!formData.fullName || !formData.schoolEmail || !formData.subject || !formData.helpNeeded) {
            alert('Please fill in all fields');
            return;
        }

        if (!formData.acknowledgements.rti || !formData.acknowledgements.materials) {
            alert('Please acknowledge both requirements');
            return;
        }

        try {
            // Check if already registered for this session
            const { data: existingReg, error: checkError } = await supabase
                .from('group_tutoring_registrations')
                .select('id')
                .eq('session_id', selectedSession.id)
                .eq('school_email', formData.schoolEmail);

            if (existingReg && existingReg.length > 0) {
                alert('You\'re already registered for this session');
                setShowRegistrationForm(false);
                return;
            }

            console.log('Submitting registration...');
            
            const { data, error } = await supabase
                .from('group_tutoring_registrations')
                .insert({
                    session_id: selectedSession.id,
                    full_name: formData.fullName,
                    school_email: formData.schoolEmail,
                    subject: subject,
                    help_needed: formData.helpNeeded,
                    previous_programs: formData.previousPrograms,
                    registered_at: new Date().toISOString(),
                    room_assignment: selectedSession.room_assignment
                });

            if (error) {
                if (error.code === '23505') {
                    alert('You\'re already registered for this session');
                } else {
                    console.error('Supabase error:', error);
                    alert('Error registering: ' + error.message);
                }
                return;
            }

            // ... rest of the code
        } catch (err) {
            console.error('Error:', err);
            alert('An error occurred. Please try again.');
        }
    };

    const handleRemoveSession = async (registrationId) => {
        if (!window.confirm('Are you sure you want to remove yourself from this session?')) {
            return;
        }

        try {
            const { error } = await supabase
                .from('group_tutoring_registrations')
                .delete()
                .eq('id', registrationId);

            if (error) {
                alert('Error removing session: ' + error.message);
            } else {
                alert('Removed from session');
                await fetchTutorSessions(user.id);
            }
        } catch (err) {
            console.error('Error:', err);
            alert('An error occurred. Please try again.');
        }
    };

    // Not logged in
    if (!user) {
        return (
            <div className="tutor-profile-page">
                <h2>Tutor Profile</h2>
                <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                    Please log in to access your tutor profile.
                </p>
            </div>
        );
    }

    // Allow if they're already a tutor/admin, OR if they're trying to create a profile
    if (userRole && userRole !== 'tutor' && userRole !== 'admin') {
        return (
            <div className="tutor-profile-page">
                <h2>Tutor Profile</h2>
                <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                    Only tutors and admins can access this page. Contact an admin to become a tutor.
                </p>
            </div>
        );
    }

    // If userRole is null/loading, show a loading state or allow edit mode
    if (!userRole) {
        return (
            <div className="tutor-profile-page">
                <h2>Tutor Profile</h2>
                <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                    Loading...
                </p>
            </div>
        );
    }

    // View mode (profile exists and not editing)
    if (tutorProfile && !isEditing) {
        // Add this to show upcoming sessions separately
        const upcomingSessions = registeredSessions.filter(reg => 
            new Date(reg.group_tutoring_sessions?.session_date) > new Date()
        );

        return (
            <div className="tutor-profile-page">
                <h2>Tutor Profile</h2>
                
                <div className="profile-card">
                    {photoPreview && (
                        <div className="profile-photo">
                            <img src={photoPreview} alt={name} />
                        </div>
                    )}
                    
                    <div className="profile-info">
                        <h3>{name}</h3>
                        <p className="subjects"><strong>Subjects:</strong> {subjects}</p>
                    </div>

                    {/* Comment out the entire profile-stats div
                    <div className="profile-stats" style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '1rem',
                        marginTop: '1.5rem',
                        padding: '1rem',
                        backgroundColor: 'var(--bg-secondary)',
                        borderRadius: '8px'
                    }}>
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ margin: '0', fontSize: '1.8em', fontWeight: 700, color: 'var(--accent-primary)' }}>
                                {tutorStats.totalSessions}
                            </p>
                            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9em', color: 'var(--text-secondary)' }}>
                                Total Sessions
                            </p>
                        </div>
                        
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ margin: '0', fontSize: '1.8em', fontWeight: 700, color: 'var(--accent-primary)' }}>
                                {tutorStats.upcomingSessions}
                            </p>
                            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9em', color: 'var(--text-secondary)' }}>
                                Upcoming Sessions
                            </p>
                        </div>
                        
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ margin: '0', fontSize: '1.8em', fontWeight: 700, color: 'var(--accent-primary)' }}>
                                {tutorStats.totalStudents}
                            </p>
                            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9em', color: 'var(--text-secondary)' }}>
                                Unique Students
                            </p>
                        </div>
                    </div>
                    */}

                    <button onClick={() => setIsEditing(true)} className="edit-profile-button">
                        Edit Profile
                    </button>
                </div>

                {/* Upcoming Sessions Section */}
                {upcomingSessions.length > 0 && (
                    <div style={{ marginTop: '2rem' }}>
                        <h3>Upcoming Sessions</h3>
                        <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', padding: '1rem' }}>
                            {upcomingSessions.map(reg => (
                                <div key={reg.id} style={{ 
                                    padding: '1rem', 
                                    borderBottom: '1px solid var(--border-color)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <div>
                                        <p style={{ margin: '0 0 0.5rem 0', fontWeight: 600 }}>
                                            {reg.group_tutoring_sessions?.session_time} • {reg.group_tutoring_sessions?.teacher_name}
                                        </p>
                                        <p style={{ margin: '0', fontSize: '0.9em', color: 'var(--text-secondary)' }}>
                                            {new Date(reg.group_tutoring_sessions?.session_date).toLocaleDateString()}
                                        </p>
                                        <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9em', color: 'var(--text-secondary)' }}>
                                            Room: {reg.group_tutoring_sessions?.room_assignment}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleRemoveSession(reg.id)}
                                        className="delete-button"
                                        style={{
                                            padding: '0.5rem 1rem',
                                            backgroundColor: 'rgba(220, 38, 38, 0.1)',
                                            color: 'var(--accent-danger)',
                                            border: '1px solid var(--accent-danger)',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            fontSize: '0.85em',
                                            fontWeight: 500
                                        }}
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Registered Sessions Section (all sessions)
                {registeredSessions.length > 0 && (
                    <div style={{ marginTop: '2rem' }}>
                        <h3>All Registered Sessions</h3>
                        <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', padding: '1rem' }}>
                            {registeredSessions.map(reg => (
                                <div key={reg.id} style={{ 
                                    padding: '1rem', 
                                    borderBottom: '1px solid var(--border-color)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <div>
                                        <p style={{ margin: '0 0 0.5rem 0', fontWeight: 600 }}>
                                            {reg.group_tutoring_sessions?.session_time}
                                        </p>
                                        <p style={{ margin: '0', fontSize: '0.9em', color: 'var(--text-secondary)' }}>
                                            {new Date(reg.group_tutoring_sessions?.session_date).toLocaleDateString()}
                                        </p>
                                        <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9em', color: 'var(--text-secondary)' }}>
                                            Room: {reg.group_tutoring_sessions?.room_assignment}
                                        </p>
                                    </div>
                                </div>
                            ))}}
                        </div>
                    </div>
                )*/}
            </div>
        );
    }

    // Edit mode
    return (
        <div className="tutor-profile-page" style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem' }}>
            <h2>Tutor Profile</h2>
            
            <form onSubmit={handleSubmit} className="profile-form" style={{
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '12px',
                padding: '2rem',
                border: '1px solid var(--border-color)'
            }}>
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Name *</label>
                    <input
                        type="text"
                        placeholder="Your name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: '1px solid var(--border-color)',
                            borderRadius: '6px',
                            backgroundColor: 'var(--bg-primary)',
                            color: 'var(--text-primary)',
                            fontSize: '1em',
                            boxSizing: 'border-box'
                        }}
                    />
                </div>

                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 500 }}>Subjects You Can Tutor *</label>
                    <div className="subjects-grid">
                        {mathSubjects.map(subject => (
                            <label key={subject} className="subject-label">
                                <input
                                    type="checkbox"
                                    checked={selectedSubjects.includes(subject)}
                                    onChange={() => handleSubjectChange(subject)}
                                />
                                <span>{subject}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {selectedSubjects.includes('Other') && (
                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Specify Other Subject(s) *</label>
                        <input
                            type="text"
                            placeholder="e.g., Physics, Chemistry"
                            value={otherSubject}
                            onChange={(e) => setOtherSubject(e.target.value)}
                            required={selectedSubjects.includes('Other')}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                border: '1px solid var(--border-color)',
                                borderRadius: '6px',
                                backgroundColor: 'var(--bg-primary)',
                                color: 'var(--text-primary)',
                                fontSize: '1em',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>
                )}

                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Profile Photo (Optional)</label>
                    <ImageUpload
                        onUpload={handlePhotoUpload}
                        currentPhotoUrl={tutorProfile?.photo}
                    />
                </div>

                <div className="form-buttons" style={{ display: 'flex', gap: '1rem' }}>
                    <button type="submit" disabled={loading} className="submit-button" style={{ flex: 1, opacity: loading ? 0.6 : 1 }}>
                        {loading ? 'Saving...' : tutorProfile ? 'Update Profile' : 'Create Profile'}
                    </button>
                    {tutorProfile && (
                        <button 
                            type="button" 
                            onClick={() => setIsEditing(false)}
                            className="cancel-button"
                            style={{
                                flex: 1,
                                padding: '0.75rem 1.5rem',
                                backgroundColor: 'var(--bg-tertiary)',
                                color: 'var(--text-primary)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '1em',
                                fontWeight: 500
                            }}
                        >
                            Cancel
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}

export default TutorProfilePage;