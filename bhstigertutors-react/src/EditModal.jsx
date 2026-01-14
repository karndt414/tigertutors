import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import './LoginModal.css';

function EditModal({ tutor, onClose, onUpdated }) {
    const [name, setName] = useState('');
    const [subjects, setSubjects] = useState('');
    const [photoUrl, setPhotoUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [adminCheckLoading, setAdminCheckLoading] = useState(true);

    useEffect(() => {
        if (tutor) {
            setName(tutor.name || '');
            setSubjects(tutor.subjects || '');
            setPhotoUrl(tutor.photo || '');
            checkAdminAccess();
        }
    }, [tutor]);

    const checkAdminAccess = async () => {
        setAdminCheckLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setIsAdmin(false);
                setAdminCheckLoading(false);
                return;
            }

            const { data, error } = await supabase
                .from('users')
                .select('role')
                .eq('id', user.id)
                .single();

            if (error) {
                console.error('Error checking admin status:', error);
                setIsAdmin(false);
            } else if (data?.role === 'admin') {
                setIsAdmin(true);
            } else {
                setIsAdmin(false);
            }
        } catch (err) {
            console.error('Admin check failed:', err);
            setIsAdmin(false);
        } finally {
            setAdminCheckLoading(false);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        
        if (!isAdmin) {
            alert('Only admins can edit tutors');
            return;
        }

        setLoading(true);

        try {
            // Log the action
            const { data: { user } } = await supabase.auth.getUser();
            await supabase
                .from('admin_audit_log')
                .insert({
                    admin_email: user?.email,
                    action: 'UPDATE_TUTOR',
                    table_name: 'tutors',
                    record_id: tutor.id,
                    details: { name, subjects, photoUrl }
                });
        } catch (err) {
            console.warn('Could not log action:', err);
        }

        const { error } = await supabase
            .from('tutors')
            .update({
                name: name,
                subjects: subjects,
                photo: photoUrl,
            })
            .eq('id', tutor.id);

        setLoading(false);
        if (error) {
            alert('Error updating tutor: ' + error.message);
        } else {
            alert('Tutor updated!');
            onUpdated();
            onClose();
        }
    };

    if (!tutor) return null;

    if (adminCheckLoading) {
        return (
            <div className="modal-backdrop" onClick={onClose}>
                <div className="modal-content" onClick={e => e.stopPropagation()}>
                    <button onClick={onClose} className="close-button">&times;</button>
                    <p>Checking permissions...</p>
                </div>
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="modal-backdrop" onClick={onClose}>
                <div className="modal-content" onClick={e => e.stopPropagation()}>
                    <button onClick={onClose} className="close-button">&times;</button>
                    <p style={{ color: 'var(--accent-danger)' }}>
                        ⚠️ Admin access required to edit tutors
                    </p>
                </div>
            </div>
        );
    }

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

                    <button type="submit" disabled={loading} style={{ width: '100%', marginTop: '10px' }}>
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default EditModal;