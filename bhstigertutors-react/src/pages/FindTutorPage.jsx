import React from 'react';
import { useOutletContext } from 'react-router-dom';
import TutorCard from '../TutorCard'; // Go up one directory

function FindTutorPage() {
    // This hook gets the 'context' (props) from the <Outlet> in Layout.jsx
    const { tutors, loading } = useOutletContext();

    if (loading) {
        return <p style={{ textAlign: 'center' }}>Loading Tutors...</p>;
    }

    return (
        <div>
            <h2>Meet the Tutors</h2>
            <div className="tutor-grid">
                {tutors.map(tutor => (
                    <TutorCard
                        key={tutor.id}
                        name={tutor.name}
                        subjects={tutor.subjects}
                        photo={tutor.photo}
                        bookingLink={tutor.bookingLink}
                    />
                ))}
            </div>
        </div>
    );
}

export default FindTutorPage;