import React from 'react';
import './TutorCard.css';

// This component takes 'props' (properties) and displays them.
function TutorCard({ name, subjects, photo, bookingLink }) {
    return (
        <div className="tutor-card">
            <img src={photo} alt={`Profile of ${name}`} />
            <h3>{name}</h3>
            <p>{subjects}</p>
            <a href={bookingLink} className="book-button" target="_blank" rel="noopener noreferrer">
                Book a Session
            </a>
        </div>
    );
}

export default TutorCard;