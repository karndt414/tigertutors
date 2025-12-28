import React from 'react';
import './TutorCard.css';

function TutorCard({ name, subjects, photo, bookingLink }) {
    return (
        <div className="tutor-card">
            <div className="tutor-photo">
                <img src={photo} alt={`Profile of ${name}`} />
            </div>
            <div className="tutor-info">
                <h3>{name}</h3>
                <p>{subjects}</p>
                <a href={bookingLink} className="book-button" target="_blank" rel="noopener noreferrer">
                    Book a Session
                </a>
            </div>
        </div>
    );
}

export default TutorCard;