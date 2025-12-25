import React, { useState } from 'react';
import { supabase } from './supabaseClient';
import './LoginModal.css';

function LoginModal({ isOpen, onClose }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [loading, setLoading] = useState(false);

    // If the modal isn't open, don't render anything
    if (!isOpen) return null;

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;
                alert("Success! If email confirmation is on, check your inbox. Otherwise, try logging in!");
                setIsSignUp(false); // Switch back to login mode
            } else {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                onClose(); // Close modal on success
            }
        } catch (error) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <button className="close-button" onClick={onClose}>&times;</button>

                <h2>{isSignUp ? 'Apply to be a Tutor' : 'Tutor Login'}</h2>

                <form onSubmit={handleAuth}>
                    <div className="input-group">
                        <label>School Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className="login-submit-btn" disabled={loading}>
                        {loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Login')}
                    </button>
                </form>

                <div className="modal-footer">
                    <p>
                        {isSignUp ? "Already have an account?" : "New here?"}
                        <button
                            type="button"
                            className="toggle-auth-btn"
                            onClick={() => setIsSignUp(!isSignUp)}
                        >
                            {isSignUp ? 'Login instead' : 'Sign up to be a tutor'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default LoginModal;