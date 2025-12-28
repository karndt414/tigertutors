import React, { useState } from 'react';
import { supabase } from './supabaseClient';
import './LoginModal.css';

function LoginModal({ isOpen, onClose }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [setupCode, setSetupCode] = useState('');
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

                // Check setup code if registering as admin/tutor
                if (role !== 'learner') {
                    if (!setupCode.trim()) {
                        setError(`Setup code required to register as ${role}`);
                        setLoading(false);
                        return;
                    }

                    // Verify the setup code
                    const { data: codeData, error: codeError } = await supabase
                        .from('admin_setup_codes')
                        .select('*')
                        .eq('code', setupCode.toUpperCase())
                        .single();

                    if (codeError || !codeData) {
                        setError('Invalid setup code');
                        setLoading(false);
                        return;
                    }

                    // Check if code is expired
                    if (codeData.expires_at && new Date(codeData.expires_at) < new Date()) {
                        setError('Setup code has expired');
                        setLoading(false);
                        return;
                    }

                    // Check if code already used
                    if (codeData.used_by) {
                        setError('This setup code has already been used');
                        setLoading(false);
                        return;
                    }

                    // Check if code role matches requested role
                    if (codeData.role !== role) {
                        setError(`This code is for ${codeData.role} registration only`);
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

                // Create user profile
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

                // Mark setup code as used
                if (setupCode.trim()) {
                    await supabase
                        .from('admin_setup_codes')
                        .update({
                            used_by: email,
                            used_at: new Date(),
                        })
                        .eq('code', setupCode.toUpperCase());
                }

                setSuccess(`Account created as ${finalRole}! Check your email to confirm.`);
                setTimeout(() => {
                    setEmail('');
                    setPassword('');
                    setSetupCode('');
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

                            {role !== 'learner' && (
                                <input
                                    type="text"
                                    placeholder="Setup Code"
                                    value={setupCode}
                                    onChange={(e) => setSetupCode(e.target.value.toUpperCase())}
                                    required
                                />
                            )}

                            <p style={{ fontSize: '0.8em', color: 'var(--text-secondary)', margin: '0' }}>
                                Learners don't need a code. Tutors and Admins need a setup code.
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
                            setSetupCode('');
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