import React from 'react';
import './ErrorPopup.css';

function ErrorPopup({ isOpen, onClose }) {
    if (!isOpen) return null;

    return (
        <div className="error-backdrop" onClick={onClose}>
            <div className="error-popup" onClick={(e) => e.stopPropagation()}>
                <h2>⚠️ Oops! Something went wrong</h2>
                <p>
                    Please try again, and if the issue persists, go to the <strong>"Contact Us"</strong> page 
                    and fill out a <strong>"Report an Issue"</strong> form so we can help!
                </p>
                <button onClick={onClose} className="error-button">
                    Got it
                </button>
            </div>
        </div>
    );
}

export default ErrorPopup;