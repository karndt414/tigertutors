import React from 'react';
import './TutorCard.css';

function TutorCard({ name, subjects, photo }) {
    return (
        <div className="tutor-card">
            <img src={photo} alt={name} />
            <div className="tutor-card-content">
                <h3>{name}</h3>
                <p>{subjects}</p>
            </div>
        </div>
    );
}

export default TutorCard;