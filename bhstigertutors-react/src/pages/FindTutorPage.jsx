import React from 'react';
import TutorCard from '../TutorCard';

function FindTutorPage({ tutors, loading }) {
    if (loading) {
        return <p style={{ textAlign: 'center' }}>Loading Tutors...</p>;
    }

    return (
        <div>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                marginBottom: '1.5rem'
            }}>
                <div style={{
                    width: '80px',
                    height: '80px',
                    border: '2px solid black',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    flexShrink: 0
                }}>
                    <img 
                        src="/logo.jpeg" 
                        alt="Logo" 
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                        }}
                    />
                </div>
                <h2 style={{ margin: 0 }}>Meet the Tutors</h2>
            </div>
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