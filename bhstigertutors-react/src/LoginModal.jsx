import React, { useState } from 'react';
import { supabase } from './supabaseClient';
import './LoginModal.css';

function LoginModal({ isOpen, onClose }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [role, setRole] = useState('learner'); // learner, tutor, admin
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
                // Sign up
                const { data, error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                });

                if (signUpError) {
                    setError(signUpError.message);
                } else {
                    // Create user profile in database
                    const { error: profileError } = await supabase.from('users').insert({
                        id: data.user.id,
                        email,
                        role,
                        created_at: new Date(),
                    });

                    if (profileError) {
                        setError(profileError.message);
                    } else {
                        setSuccess('Account created! Check your email to confirm.');
                        setTimeout(() => {
                            setEmail('');
                            setPassword('');
                            setRole('learner');
                            setIsSignUp(false);
                            onClose();
                        }, 2000);
                    }
                }
            } else {
                // Sign in
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

    // If the modal isn't open, don't render anything
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>×</button>
                
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
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            required
                        >
                            <option value="learner">Learner</option>
                            <option value="tutor">Tutor</option>
                            <option value="admin">Admin</option>
                        </select>
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