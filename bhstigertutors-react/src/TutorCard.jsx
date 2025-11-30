import React from 'react';
import './TutorCard.css'; // We'll create this CSS file next

// This component takes 'props' (properties) and displays them.
function TutorCard({ name, subjects, photo, bookingLink }) {
    return (
        <div className="tutor-card">
            <img src={photo} alt={`Profile of ${name}`} />
            <h3>{name}</h3>
            <p>{subjects}</p>
        </div>
    );
}

export default TutorCard;