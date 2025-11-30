import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import './LoginModal.css'; // We can re-use the login modal's style!

function EditModal({ tutor, onClose, onUpdated }) {
    // 1. Set up state for all form fields, pre-filled with the tutor's data
    const [name, setName] = useState('');
    const [subjects, setSubjects] = useState('');
    const [photoUrl, setPhotoUrl] = useState('');
    const [bookingLink, setBookingLink] = useState('');
    const [loading, setLoading] = useState(false);

    // 2. This 'effect' runs when the 'tutor' prop changes.
    // It populates the form when the modal opens.
    useEffect(() => {
        if (tutor) {
            setName(tutor.name || '');
            setSubjects(tutor.subjects || '');
            setPhotoUrl(tutor.photo || '');
            setBookingLink(tutor.bookingLink || '');
        }
    }, [tutor]); // Dependency: run this when 'tutor' changes

    // 3. Handle the form submission
    const handleUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);

        const { error } = await supabase
            .from('tutors')
            .update({
                name: name,
                subjects: subjects,
                photo: photoUrl,
                bookingLink: bookingLink
            })
            .eq('id', tutor.id); // This is the key: update ONLY the tutor with this ID

        setLoading(false);
        if (error) {
            alert('Error updating tutor: ' + error.message);
        } else {
            alert('Tutor updated!');
            onUpdated(); // This refreshes the list in AdminPanel
            onClose();   // This closes the modal
        }
    };

    // 4. Return null if no tutor is selected (modal is hidden)
    if (!tutor) return null;

    // 5. The JSX: a form inside the modal backdrop
    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="close-button">&times;</button>
                <h2>Edit {tutor.name}</h2>

                <form onSubmit={handleUpdate}>
                    <label>Name</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />

                    <label>Subjects</label>
                    <input
                        type="text"
                        value={subjects}
                        onChange={(e) => setSubjects(e.target.value)}
                        required
                    />

                    <label>Photo URL</label>
                    <input
                        type="text"
                        value={photoUrl}
                        onChange={(e) => setPhotoUrl(e.target.value)}
                    />

                    <label>Booking Link (Optional)</label>
                    <input
                        type="text"
                        value={bookingLink}
                        onChange={(e) => setBookingLink(e.target.value)}
                    />

                    <button type="submit" disabled={loading} style={{ width: '100%', marginTop: '10px' }}>
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default EditModal;