import React, { useState } from 'react';
import { supabase } from './supabaseClient';
import './LoginModal.css';

function LoginModal({ isOpen, onClose }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [role, setRole] = useState('learner');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            if (isSignUp) {
                let finalRole = 'learner';

                // Check if email is approved for admin/tutor role
                if (role !== 'learner') {
                    const { data: allowedRole } = await supabase
                        .from('allowed_roles')
                        .select('role')
                        .eq('email', email)
                        .single();

                    if (!allowedRole) {
                        setError(`This email hasn't been approved to register as ${role}. You can register as a learner instead.`);
                        setLoading(false);
                        return;
                    }

                    if (allowedRole.role !== role) {
                        setError(`This email is approved as ${allowedRole.role}, not ${role}`);
                        setLoading(false);
                        return;
                    }

                    finalRole = role;
                }

                // Sign up with Supabase Auth
                const { data, error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                });

                if (signUpError) {
                    setError(signUpError.message);
                    setLoading(false);
                    return;
                }

                // Create user profile with validated role
                const { error: profileError } = await supabase.from('users').insert({
                    id: data.user.id,
                    email,
                    role: finalRole,
                    created_at: new Date(),
                });

                if (profileError) {
                    setError(profileError.message);
                    setLoading(false);
                    return;
                }

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
                    setError(signInError.message);
                } else {
                    setSuccess('Logged in successfully!');
                    setTimeout(() => {
                        setEmail('');
                        setPassword('');
                        onClose();
                    }, 1000);
                }
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

                <p className="modal-toggle">
                    {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                    <button
                        type="button"
                        onClick={() => {
                            setIsSignUp(!isSignUp);
                            setError('');
                            setSuccess('');
                        }}
                    >
                        {isSignUp ? 'Login' : 'Sign Up'}
                    </button>
                </p>
            </div>
        </div>
    );
}

export default LoginModal;