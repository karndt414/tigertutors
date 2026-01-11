import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import '../App.css';

function LearnerProfilePage() {
    const [learnerProfile, setLearnerProfile] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState(null);
    const [registeredSessions, setRegisteredSessions] = useState([]);
    const [upcomingSessions, setUpcomingSessions] = useState([]);

    const [fullName, setFullName] = useState('');
    const [schoolEmail, setSchoolEmail] = useState('');

    useEffect(() => {
        checkUser();
    }, []);

    useEffect(() => {
        if (user) {
            fetchLearnerProfile();
            fetchRegisteredSessions();
        }
    }, [user]);

    const checkUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        setSchoolEmail(user?.email || '');
    };

    const fetchLearnerProfile = async () => {
        if (!user) return;

        const { data, error } = await supabase
            .from('learners')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (data) {
            setLearnerProfile(data);
            setFullName(data.full_name || '');
        }
    };

    const fetchRegisteredSessions = async () => {
        if (!user) return;

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

        if (data) {
            setRegisteredSessions(data);

            // Filter for upcoming sessions (sessions in the future)
            const now = new Date();
            const upcoming = data.filter(reg => {
                const sessionDate = new Date(reg.group_tutoring_sessions?.session_date);
                return sessionDate > now;
            });
            setUpcomingSessions(upcoming);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (learnerProfile) {
                // Update existing profile
                const { error } = await supabase
                    .from('learners')
                    .update({
                        full_name: fullName,
                        updated_at: new Date().toISOString()
                    })
                    .eq('user_id', user.id);

                if (error) {
                    alert('Error updating profile: ' + error.message);
                } else {
                    alert('Profile updated successfully!');
                    setIsEditing(false);
                    fetchLearnerProfile();
                }
            } else {
                // Create new profile
                const { error } = await supabase
                    .from('learners')
                    .insert({
                        user_id: user.id,
                        full_name: fullName,
                        school_email: schoolEmail,
                        created_at: new Date().toISOString()
                    });

                if (error) {
                    alert('Error creating profile: ' + error.message);
                } else {
                    alert('Profile created successfully!');
                    setIsEditing(false);
                    fetchLearnerProfile();
                }
            }
        } catch (err) {
            console.error('Submit error:', err);
            alert('Error saving profile');
        } finally {
            setLoading(false);
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
                await fetchRegisteredSessions();
            }
        } catch (err) {
            console.error('Error:', err);
            alert('An error occurred. Please try again.');
        }
    };

    if (!user) {
        return <p style={{ textAlign: 'center', marginTop: '2rem' }}>Loading...</p>;
    }

    // View mode
    if (learnerProfile && !isEditing) {
        return (
            <div className="learner-profile-page" style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem' }}>
                <h2>My Profile</h2>

                <div className="profile-card" style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderRadius: '12px',
                    padding: '2rem',
                    border: '1px solid var(--border-color)',
                    marginBottom: '2rem'
                }}>
                    <div className="profile-info">
                        <h3>{learnerProfile.full_name}</h3>
                        <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0 0 0' }}>
                            {learnerProfile.school_email}
                        </p>
                    </div>

                    <div className="profile-stats" style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: '1rem',
                        marginTop: '1.5rem',
                        padding: '1rem',
                        backgroundColor: 'var(--bg-primary)',
                        borderRadius: '8px'
                    }}>
                        {/*
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ margin: '0', fontSize: '1.8em', fontWeight: 700, color: 'var(--accent-primary)' }}>
                                {upcomingSessions.length}
                            </p>
                            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9em', color: 'var(--text-secondary)' }}>
                                Upcoming Sessions
                            </p>
                        </div>

                        <div style={{ textAlign: 'center' }}>
                            <p style={{ margin: '0', fontSize: '1.8em', fontWeight: 700, color: 'var(--accent-primary)' }}>
                                {registeredSessions.length}
                            </p>
                            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9em', color: 'var(--text-secondary)' }}>
                                Total Sessions
                            </p>
                        </div>
                        */}
                    </div>

                    <button 
                        onClick={() => setIsEditing(true)} 
                        className="book-button"
                        style={{ marginTop: '1.5rem', width: '100%' }}
                    >
                        Edit Profile
                    </button>
                </div>

                {/* Upcoming Sessions */}
                {upcomingSessions.length > 0 && (
                    <div style={{ marginTop: '2rem' }}>
                        <h3>📅 Upcoming Sessions</h3>
                        <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', padding: '1rem', border: '1px solid var(--border-color)' }}>
                            {upcomingSessions.map(reg => (
                                <div key={reg.id} style={{
                                    padding: '1rem',
                                    borderBottom: '1px solid var(--border-color)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <div>
                                        <p style={{ margin: '0 0 0.5rem 0', fontWeight: 600, fontSize: '1.1em' }}>
                                            {reg.group_tutoring_sessions?.session_time}
                                        </p>
                                        <p style={{ margin: '0', fontSize: '0.9em', color: 'var(--text-secondary)' }}>
                                            📅 {new Date(reg.group_tutoring_sessions?.session_date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                                        </p>
                                        <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9em', color: 'var(--text-secondary)' }}>
                                            📍 Room {reg.group_tutoring_sessions?.room_assignment}
                                        </p>
                                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9em', color: 'var(--text-secondary)' }}>
                                            👨‍🏫 {reg.group_tutoring_sessions?.teacher_name}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleRemoveSession(reg.id)}
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

                {/* All Registered Sessions 
                {registeredSessions.length > 0 && (
                    <div style={{ marginTop: '2rem' }}>
                        <h3>📚 All Registered Sessions</h3>
                        <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', padding: '1rem', border: '1px solid var(--border-color)' }}>
                            {registeredSessions.map(reg => (
                                <div key={reg.id} style={{
                                    padding: '1rem',
                                    borderBottom: '1px solid var(--border-color)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    opacity: new Date(reg.group_tutoring_sessions?.session_date) < new Date() ? 0.6 : 1
                                }}>
                                    <div>
                                        <p style={{ margin: '0 0 0.5rem 0', fontWeight: 600, fontSize: '1.1em' }}>
                                            {reg.group_tutoring_sessions?.session_time}
                                        </p>
                                        <p style={{ margin: '0', fontSize: '0.9em', color: 'var(--text-secondary)' }}>
                                            {new Date(reg.group_tutoring_sessions?.session_date).toLocaleDateString()}
                                        </p>
                                        <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9em', color: 'var(--text-secondary)' }}>
                                            Room: {reg.group_tutoring_sessions?.room_assignment}
                                        </p>
                                        {new Date(reg.group_tutoring_sessions?.session_date) < new Date() && (
                                            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85em', color: 'var(--accent-danger)' }}>
                                                ✓ Completed
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}*/}

                {registeredSessions.length === 0 && (
                    <div style={{
                        marginTop: '2rem',
                        padding: '2rem',
                        backgroundColor: 'var(--bg-secondary)',
                        borderRadius: '8px',
                        textAlign: 'center',
                        border: '1px solid var(--border-color)'
                    }}>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1em' }}>
                            No sessions registered yet. Visit the Group Tutoring page to sign up! 🎓
                        </p>
                    </div>
                )}
            </div>
        );
    }

    // Edit mode
    return (
        <div className="learner-profile-page" style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem 1rem' }}>
            <h2>Edit Profile</h2>

            <form onSubmit={handleSubmit} className="profile-form" style={{
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '12px',
                padding: '2rem',
                border: '1px solid var(--border-color)'
            }}>
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Full Name *</label>
                    <input
                        type="text"
                        placeholder="Your full name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
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
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>School Email *</label>
                    <input
                        type="email"
                        value={schoolEmail}
                        disabled
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: '1px solid var(--border-color)',
                            borderRadius: '6px',
                            backgroundColor: 'var(--bg-primary)',
                            color: 'var(--text-secondary)',
                            fontSize: '1em',
                            boxSizing: 'border-box',
                            opacity: 0.6
                        }}
                    />
                    <p style={{ fontSize: '0.85em', color: 'var(--text-secondary)', margin: '0.5rem 0 0 0' }}>
                        Email cannot be changed
                    </p>
                </div>

                <div className="form-buttons" style={{ display: 'flex', gap: '1rem' }}>
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="book-button"
                        style={{ flex: 1, opacity: loading ? 0.6 : 1 }}
                    >
                        {loading ? 'Saving...' : 'Save Profile'}
                    </button>
                    <button 
                        type="button" 
                        onClick={() => setIsEditing(false)}
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
                </div>
            </form>
        </div>
    );
}

export default LearnerProfilePage;