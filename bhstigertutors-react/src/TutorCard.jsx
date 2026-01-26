import React from 'react';
import './TutorCard.css';

function TutorCard({ name, subjects, photo }) {
    return (
        <div className="tutor-card">
            <div className="tutor-photo">
                <img src={photo} alt={name} />
            </div>
            <div className="tutor-info">
                <div>
                    <h3>{name}</h3>
                    <p>{subjects}</p>
                </div>
            </div>
        </div>
    );
}

export default TutorCard;