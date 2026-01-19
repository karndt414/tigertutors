import React, { useState } from 'react';
import { supabase } from './supabaseClient';
import './LoginModal.css';

function LoginModal({ isOpen, onClose }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [isTutorRequest, setIsTutorRequest] = useState(false);
    const [role, setRole] = useState('learner');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [tutorName, setTutorName] = useState('');
    const [tutorEmail, setTutorEmail] = useState('');

    const handleTutorRequest = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            // 1. Fetch existing pending requests
            const { data: configData } = await supabase
                .from('site_config')
                .select('value')
                .eq('key', 'pending_tutor_requests')
                .single();

            let pendingRequests = [];
            if (configData && configData.value) {
                pendingRequests = JSON.parse(configData.value);
            }

            // 2. Check if email already exists
            if (pendingRequests.find(req => req.email === tutorEmail.toLowerCase())) {
                setError('This email has already submitted a request');
                setLoading(false);
                return;
            }

            // 3. Add new request
            const newRequest = {
                email: tutorEmail.toLowerCase(),
                name: tutorName,
                timestamp: new Date().toISOString()
            };
            pendingRequests.push(newRequest);

            // 4. Save back to site_config
            const { error: configError } = await supabase
                .from('site_config')
                .upsert({
                    key: 'pending_tutor_requests',
                    value: JSON.stringify(pendingRequests),
                    updated_at: new Date().toISOString()
                }, { onConflict: 'key' });

            if (configError) {
                setError('Error submitting request: ' + configError.message);
                setLoading(false);
                return;
            }

            // 5. Send email notification (existing code)
            await fetch('/api/send-tutor-approval-request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tutorEmail: tutorEmail.toLowerCase(),
                    tutorName,
                    timestamp: new Date().toISOString()
                })
            });

            setSuccess('Tutor request submitted! Check your email for updates.');
            setTutorEmail('');
            setTutorName('');
        } catch (err) {
            console.error('Signup error:', err);
            setError('Error submitting request');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            if (isSignUp) {
                let finalRole = 'learner';

                // Check if email is approved for tutor role
                if (role === 'tutor') {
                    const { data: allowedRole, error: roleError } = await supabase
                        .from('allowed_roles')
                        .select('role')
                        .eq('email', email.toLowerCase())
                        .single();

                    console.log('Tutor check - Data:', allowedRole, 'Error:', roleError);

                    if (roleError || !allowedRole) {
                        setError('This email has not been approved as a tutor. Use the "Request Tutor Access" button instead.');
                        setLoading(false);
                        return;
                    }

                    if (allowedRole.role !== 'tutor') {
                        setError(`This email is approved as ${allowedRole.role}, not tutor`);
                        setLoading(false);
                        return;
                    }

                    finalRole = 'tutor';
                }

                // Check if email is approved for admin role
                if (role === 'admin') {
                    const { data: allowedRole, error: roleError } = await supabase
                        .from('allowed_roles')
                        .select('role')
                        .eq('email', email.toLowerCase())
                        .single();

                    console.log('Admin check - Data:', allowedRole, 'Error:', roleError);

                    if (roleError || !allowedRole || allowedRole.role !== 'admin') {
                        setError('This email has not been approved as an admin.');
                        setLoading(false);
                        return;
                    }

                    finalRole = 'admin';
                }

                // Sign up with Supabase Auth
                const { data, error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                });

                if (signUpError) {
                    console.error('Sign up error:', signUpError);
                    setError(signUpError.message);
                    setLoading(false);
                    return;
                }

                console.log('Auth signup successful. User ID:', data.user?.id);

                // Create user profile via backend API (secure)
                const profileRes = await fetch('/api/create-user-profile', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: data.user.id,
                        email,
                        role: finalRole,
                    }),
                });

                console.log('Profile API response status:', profileRes.status);
                
                const profileData = await profileRes.json();
                console.log('Profile API response:', profileData);

                if (!profileRes.ok) {
                    console.error('Profile creation error:', profileData);
                    setError('Database error: ' + (profileData.error || 'Failed to create profile'));
                    setLoading(false);
                    return;
                }

                console.log('Profile created successfully!');

                setSuccess(`Account created as ${finalRole}!`);
                setTimeout(() => {
                    setEmail('');
                    setPassword('');
                    setRole('learner');
                    setIsSignUp(false);
                    onClose();
                }, 2000);
            } else {
                const { data, error: signInError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (signInError) {
                    console.error('Login error:', signInError);
                    setError(signInError.message);
                    setLoading(false);
                    return;
                }

                console.log('Login successful:', data.user?.id);

                // Fetch user role
                const { data: userData, error: userError } = await supabase
                    .from('users')
                    .select('role')
                    .eq('id', data.user.id)
                    .single();

                console.log('User role fetch - Data:', userData, 'Error:', userError);

                if (userError) {
                    console.error('Failed to fetch user role:', userError);
                    setError('Failed to load user profile');
                    setLoading(false);
                    return;
                }

                setSuccess('Logged in successfully!');
                setTimeout(() => {
                    setEmail('');
                    setPassword('');
                    onClose();
                }, 1000);
            }
        } catch (err) {
            setError('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="close-button" onClick={onClose}>&times;</button>
                
                {isTutorRequest ? (
                    <>
                        <h2>Request Tutor Access</h2>

                        {error && <div className="error-message">{error}</div>}
                        {success && <div className="success-message">{success}</div>}

                        <form onSubmit={handleTutorRequest}>
                            <input
                                type="text"
                                placeholder="Full Name"
                                value={tutorName}
                                onChange={(e) => setTutorName(e.target.value)}
                                required
                            />
                            <input
                                type="email"
                                placeholder="Email"
                                value={tutorEmail}
                                onChange={(e) => setTutorEmail(e.target.value)}
                                required
                            />

                            <button type="submit" disabled={loading}>
                                {loading ? 'Submitting...' : 'Submit Request'}
                            </button>
                        </form>

                        <p className="modal-toggle">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsTutorRequest(false);
                                    setError('');
                                    setSuccess('');
                                    setTutorName('');
                                    setTutorEmail('');
                                }}
                            >
                                Back to Login
                            </button>
                        </p>
                    </>
                ) : (
                    <>
                        <h2>{isSignUp ? 'Create Account' : 'Login'}</h2>

                        {error && <div className="error-message">{error}</div>}
                        {success && <div className="success-message">{success}</div>}

                        <form onSubmit={handleSubmit}>
                            <input
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />

                            {isSignUp && (
                                <>
                                    <select
                                        value={role}
                                        onChange={(e) => setRole(e.target.value)}
                                        required
                                    >
                                        <option value="learner">Learner</option>
                                        <option value="tutor">Tutor</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                    <p style={{ fontSize: '0.8em', color: 'var(--text-secondary)', margin: '0' }}>
                                        Tutors and Admins must be pre-approved by an administrator.
                                    </p>
                                </>
                            )}

                            <button type="submit" disabled={loading}>
                                {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Login'}
                            </button>
                        </form>

                        {!isSignUp && (
                            <p className="modal-toggle">
                                Don't have an account?{' '}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsSignUp(true);
                                        setError('');
                                        setSuccess('');
                                    }}
                                >
                                    Sign Up
                                </button>
                                {' '}or{' '}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsTutorRequest(true);
                                        setError('');
                                        setSuccess('');
                                    }}
                                >
                                    Request Tutor Access
                                </button>
                            </p>
                        )}

                        {isSignUp && (
                            <p className="modal-toggle">
                                Already have an account?{' '}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsSignUp(false);
                                        setError('');
                                        setSuccess('');
                                    }}
                                >
                                    Login
                                </button>
                            </p>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default LoginModal;