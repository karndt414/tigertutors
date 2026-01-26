import React from 'react';
import TutorCard from '../TutorCard';

function FindTutorPage({ tutors, loading }) {
    if (loading) {
        return <p style={{ textAlign: 'center' }}>Loading Tutors...</p>;
    }

    return (
        <div>
            <h2>Meet the Tutors</h2>
            <div className="tutor-grid">
                {tutors && tutors.length > 0 ? (
                    tutors.map(tutor => (
                        <TutorCard
                            key={tutor.id}
                            name={tutor.name}
                            subjects={tutor.subjects}
                            photo={tutor.photo || '/favicon.png'}
                        />
                    ))
                ) : (
                    <p>No tutors available at the moment.</p>
                )}
            </div>
        </div>
    );
}

export default FindTutorPage;