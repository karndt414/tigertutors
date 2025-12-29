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
    }, []);

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
                
                // If tutor or admin, fetch their tutor profile
                if (userData.role === 'tutor' || userData.role === 'admin') {
                    fetchTutorProfile(user.id);
                }
            }
        }
    };

    // Add this function to fetch tutor's sessions
    const fetchTutorSessions = async (userId) => {
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
            .eq('school_email', user?.email)
            .order('registered_at', { ascending: false });
        
        if (error) console.error(error);
        else setRegisteredSessions(data || []);
    };

    // Add this function to calculate stats
    const fetchTutorStats = async () => {
        const { data, error } = await supabase
            .from('group_tutoring_registrations')
            .select(`
                *,
                group_tutoring_sessions (
                    session_date
                )
            `)
            .eq('school_email', user?.email);
        
        if (data) {
            const now = new Date();
            const upcoming = data.filter(reg => 
                new Date(reg.group_tutoring_sessions?.session_date) > now
            ).length;
            
            setTutorStats({
                totalSessions: data.length,
                totalStudents: new Set(data.map(d => d.full_name)).size,
                upcomingSessions: upcoming
            });
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
            fetchTutorSessions(userId);
            fetchTutorStats();  // Add this
        } else if (error?.code === 'PGRST116') {
            // No profile yet - that's ok, they can create one
            setIsEditing(true);
        }
    };

    const handlePhotoUpload = (url) => {
        setPhotoUrl(url);
        setPhotoPreview(url);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        if (!photoUrl) {
            alert('Please upload a photo for your profile.');
            setLoading(false);
            return;
        }

        try {
            if (tutorProfile) {
                // Update existing profile
                const { error } = await supabase
                    .from('tutors')
                    .update({
                        name,
                        subjects,
                        photo: photoUrl
                    })
                    .eq('id', user.id);

                if (error) {
                    alert('Error updating profile: ' + error.message);
                } else {
                    alert('Profile updated!');
                    setIsEditing(false);
                    fetchTutorProfile(user.id);
                }
            } else {
                // Create new profile
                const { error } = await supabase
                    .from('tutors')
                    .insert({
                        id: user.id,
                        name,
                        subjects,
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

    // Not a tutor or admin
    if (userRole !== 'tutor' && userRole !== 'admin') {
        return (
            <div className="tutor-profile-page">
                <h2>Tutor Profile</h2>
                <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                    Only tutors and admins can access this page.
                </p>
            </div>
        );
    }

    // View mode (profile exists and not editing)
    if (tutorProfile && !isEditing) {
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

                {/* Registered Sessions Section */}
                {(userRole === 'tutor' || userRole === 'admin') && registeredSessions.length > 0 && (
                    <div style={{ marginTop: '2rem' }}>
                        <h3>Registered Sessions</h3>
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
        <div className="tutor-profile-page">
            <h2>Tutor Profile</h2>
            
            <form onSubmit={handleSubmit} className="profile-form">
                <div className="form-group">
                    <label>Name *</label>
                    <input
                        type="text"
                        placeholder="Your name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Subjects (e.g., Calculus AB, Physics 1) *</label>
                    <input
                        type="text"
                        placeholder="List the subjects you can tutor"
                        value={subjects}
                        onChange={(e) => setSubjects(e.target.value)}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Profile Photo *</label>
                    <ImageUpload onUpload={handlePhotoUpload} />
                </div>

                <div className="form-buttons">
                    <button type="submit" disabled={loading} className="submit-button">
                        {loading ? 'Saving...' : tutorProfile ? 'Update Profile' : 'Create Profile'}
                    </button>
                    {tutorProfile && (
                        <button 
                            type="button" 
                            onClick={() => setIsEditing(false)}
                            className="cancel-button"
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