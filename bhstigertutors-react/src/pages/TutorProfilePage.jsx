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

    // Add this state for stats
    const [tutorStats, setTutorStats] = useState({
        totalSessions: 0,
        totalStudents: 0,
        upcomingSessions: 0
    });

    useEffect(() => {
        checkUser();
        
        // Listen for registration updates
        const handleSessionRegistered = () => {
            if (user) {
                fetchTutorSessions(user.id);
                fetchTutorStats();
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

    // Add this function to calculate stats
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

    const fetchTutorProfile = async (userId) => {
        const { data, error } = await supabase
            .from('tutors')
            .select('*')
            .eq('id', userId)
            .single();

        if (data) {
            setTutorProfile(data);
            setName(data.name || '');
            setSubjects(data.subjects || '');
            setPhotoUrl(data.photo || '');
            setPhotoPreview(data.photo || '');
            await fetchTutorSessions(userId);
            await fetchTutorStats();
        } else if (error?.code === 'PGRST116') {
            setIsEditing(true);
        }
    };

    const handlePhotoUpload = (url) => {
        setPhotoUrl(url);
        setPhotoPreview(url);
    };

    const handleSubjectChange = (subject) => {
        setSelectedSubjects(prev => 
            prev.includes(subject) 
                ? prev.filter(s => s !== subject)
                : [...prev, subject]
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        if (!photoUrl) {
            alert('Please upload a photo for your profile.');
            setLoading(false);
            return;
        }

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
                        photo: photoUrl
                    })
                    .eq('id', tutorProfile.id);

                if (error) {
                    alert('Error updating profile: ' + error.message);
                } else {
                    alert('Profile updated!');
                    setIsEditing(false);
                    fetchTutorProfile(user.id);
                }
            } else {
                const { error } = await supabase
                    .from('tutors')
                    .insert({
                        id: user.id,
                        name,
                        subjects: subjectsString,
                        photo: photoUrl,
                        is_approved: false
                    });

                if (error) {
                    alert('Error creating profile: ' + error.message);
                } else {
                    alert('Profile created! Admin will review and approve it.');
                    setIsEditing(false);
                    fetchTutorProfile(user.id);
                }
            }
        } catch (err) {
            console.error('Error:', err);
            alert('An error occurred. Please try again.');
        } finally {
            setLoading(false);
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

                    {/* Add this statistics section */}
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
                            ))}
                        </div>
                    </div>
                )}

                {/* Registered Sessions Section (all sessions) */}
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
                            ))}
                        </div>
                    </div>
                )}
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
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                        gap: '0.75rem',
                        padding: '1rem',
                        backgroundColor: 'var(--bg-primary)',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color)'
                    }}>
                        {mathSubjects.map(subject => (
                            <label key={subject} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                <input
                                    type="checkbox"
                                    checked={selectedSubjects.includes(subject)}
                                    onChange={() => handleSubjectChange(subject)}
                                    style={{ cursor: 'pointer', flexShrink: 0 }}
                                />
                                <span style={{ fontSize: '0.95em' }}>{subject}</span>
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
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Profile Photo *</label>
                    <ImageUpload onUpload={handlePhotoUpload} />
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