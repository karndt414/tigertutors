import React, { useState } from 'react';
import { supabase } from './supabaseClient';
import './LoginModal.css';

function LoginModal({ isOpen, onClose }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false); // New state to toggle mode
    const [loading, setLoading] = useState(false);

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);

        if (isSignUp) {
            // SIGN UP logic
            const { error } = await supabase.auth.signUp({ email, password });
            if (error) alert(error.message);
            else alert("Check your email for the confirmation link!");
        } else {
            // SIGN IN logic
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) alert(error.message);
            else onClose();
        }
        setLoading(false);
    };

    if (!isOpen) return null;

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <button className="close-button" onClick={onClose}>&times;</button>
                <h2>{isSignUp ? 'Create Tutor Account' : 'Tutor Login'}</h2>

                <form onSubmit={handleAuth}>
                    <input
                        type="email"
                        placeholder="School Email"
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
                    <button type="submit" disabled={loading}>
                        {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Login')}
                    </button>
                </form>

                <p style={{ marginTop: '15px', fontSize: '0.9em' }}>
                    {isSignUp ? "Already have an account?" : "Want to join the team?"}
                    <button
                        onClick={() => setIsSignUp(!isSignUp)}
                        style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', marginLeft: '5px' }}
                    >
                        {isSignUp ? 'Login here' : 'Sign up here'}
                    </button>
                </p>
            </div>
        </div>
    );
}

export default LoginModal;