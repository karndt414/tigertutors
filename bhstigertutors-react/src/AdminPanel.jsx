import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import ImageUpload from './ImageUpload'; 
import EditModal from './EditModal';
import './AdminPanel.css';

function AdminPanel({ tutors, onTutorAdded, onSignOut }) {
    const [name, setName] = useState('');
    const [subjects, setSubjects] = useState('');
    const [photoUrl, setPhotoUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [editingTutor, setEditingTutor] = useState(null);
    const [allowedRoles, setAllowedRoles] = useState([]);
    const [newEmail, setNewEmail] = useState('');
    const [newRole, setNewRole] = useState('tutor');
    const [user, setUser] = useState(null);
    const [allUsers, setAllUsers] = useState([]);
    const [groupSessions, setGroupSessions] = useState([]);
    const [newGroupSession, setNewGroupSession] = useState({
        sessionDate: '',
        sessionTime: '',
        subjects: [], // Changed to array
        roomAssignment: '',
        teacherName: ''
    });
    const [groupTutoringRegistrations, setGroupTutoringRegistrations] = useState([]);

    useEffect(() => {
        checkUser();
        fetchAllowedRoles();
        fetchAllUsers();
        fetchGroupSessions();
        fetchGroupTutoringRegistrations();
    }, []);

    const checkUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!photoUrl) {
            alert('Please upload a photo for the tutor.');
            return;
        }

        setLoading(true);

        const { error } = await supabase
            .from('tutors')
            .insert([{ name, subjects, photo: photoUrl}]);

        if (error) {
            alert('Error adding tutor: ' + error.message);
        } else {
            alert('Tutor added!');
            setName('');
            setSubjects('');
            setPhotoUrl('');
            onTutorAdded();
        }
        setLoading(false);
    };

    const handleDelete = async (tutorId) => {
        if (!window.confirm('Are you sure you want to delete this tutor?')) {
            return;
        }

        const { error } = await supabase
            .from('tutors')
            .delete()
            .eq('id', tutorId);

        if (error) {
            alert('Error deleting tutor: ' + error.message);
        } else {
            alert('Tutor deleted.');
            onTutorAdded();
        }
    };

    const handleApprove = async (tutorId) => {
        const { error } = await supabase
            .from('tutors')
            .update({ is_approved: true })
            .eq('id', tutorId);

        if (error) alert(error.message);
        else {
            alert("Tutor approved!");
            onTutorAdded();
        }
    };

    const fetchGroupSessions = async () => {
        const { data, error } = await supabase
            .from('group_tutoring_sessions')
            .select('*')
            .order('session_date', { ascending: true });
        
        if (error) console.error(error);
        else setGroupSessions(data || []);
    };

    const fetchAllowedRoles = async () => {
        const { data, error } = await supabase
            .from('allowed_roles')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) console.error(error);
        else setAllowedRoles(data || []);
    };

    const fetchAllUsers = async () => {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) console.error(error);
        else setAllUsers(data || []);
    };

    const fetchGroupTutoringRegistrations = async () => {
        const { data, error } = await supabase
            .from('group_tutoring_registrations')
            .select('*')
            .order('registered_at', { ascending: false });
        
        if (error) console.error(error);
        else setGroupTutoringRegistrations(data || []);
    };

    const handleAddAllowedRole = async (e) => {
        e.preventDefault();
        
        if (!newEmail.trim()) {
            alert('Please enter an email');
            return;
        }

        const { error } = await supabase
            .from('allowed_roles')
            .insert({
                email: newEmail.toLowerCase(),
                role: newRole,
                approved_by: user?.email || 'admin'
            });

        if (error) {
            if (error.code === '23505') {
                alert('This email is already approved');
            } else {
                alert('Error: ' + error.message);
            }
        } else {
            alert(`${newEmail} approved as ${newRole}!`);
            setNewEmail('');
            setNewRole('tutor');
            fetchAllowedRoles();
        }
    };

    const handleRemoveAllowedRole = async (allowedRoleId) => {
        if (!window.confirm('Remove this approval?')) return;

        const { error } = await supabase
            .from('allowed_roles')
            .delete()
            .eq('id', allowedRoleId);

        if (error) {
            alert('Error: ' + error.message);
        } else {
            alert('Approval removed');
            fetchAllowedRoles();
        }
    };

    const handleAddGroupSession = async (e) => {
        e.preventDefault();

        if (!newGroupSession.sessionDate || !newGroupSession.sessionTime || newGroupSession.subjects.length === 0 || !newGroupSession.roomAssignment || !newGroupSession.teacherName) {
            alert('Please fill in all fields and select at least one subject');
            return;
        }

        const { error } = await supabase
            .from('group_tutoring_sessions')
            .insert({
                session_date: newGroupSession.sessionDate,
                session_time: newGroupSession.sessionTime,
                subjects: newGroupSession.subjects, // Now an array
                room_assignment: newGroupSession.roomAssignment,
                teacher_name: newGroupSession.teacherName
            });

        if (error) {
            alert('Error adding session: ' + error.message);
        } else {
            alert('Group tutoring session added!');
            setNewGroupSession({
                sessionDate: '',
                sessionTime: '',
                subjects: [],
                roomAssignment: '',
                teacherName: ''
            });
            fetchGroupSessions();
        }
    };

    const handleDeleteGroupSession = async (sessionId) => {
        if (!window.confirm('Delete this group tutoring session?')) return;

        const { error } = await supabase
            .from('group_tutoring_sessions')
            .delete()
            .eq('id', sessionId);

        if (error) {
            alert('Error: ' + error.message);
        } else {
            alert('Session deleted');
            fetchGroupSessions();
        }
    };

    return (
        <div className="admin-panel">
            <h2>Admin Panel <button onClick={onSignOut} className="signout-button">Log Out</button></h2>

            <h3>Add New Tutor</h3>
            <form onSubmit={handleSubmit}>
                <input type="text" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
                <input type="text" placeholder="Subjects (e.g., Calc AB, Geometry)" value={subjects} onChange={(e) => setSubjects(e.target.value)} required />

                <ImageUpload
                    onUpload={(url) => setPhotoUrl(url)}
                />

                <button type="submit" disabled={loading}>
                    {loading ? 'Adding...' : 'Add Tutor'}
                </button>
            </form>

            <hr />

            <h3>Create Group Tutoring Sessions</h3>
            <form onSubmit={handleAddGroupSession} style={{ marginBottom: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9em', color: 'var(--text-secondary)' }}>Session Date</label>
                        <input
                            type="datetime-local"
                            value={newGroupSession.sessionDate}
                            onChange={(e) => setNewGroupSession({ ...newGroupSession, sessionDate: e.target.value })}
                            required
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9em', color: 'var(--text-secondary)' }}>Session Time (e.g., 6.2, 6.3)</label>
                        <input
                            type="text"
                            placeholder="6.2"
                            value={newGroupSession.sessionTime}
                            onChange={(e) => setNewGroupSession({ ...newGroupSession, sessionTime: e.target.value })}
                            required
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9em', color: 'var(--text-secondary)' }}>Subjects (select multiple)</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', padding: '10px', backgroundColor: 'var(--bg-primary)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                            {['Pre-AP Geometry', 'Geometry', 'Advanced Algebra 2', 'Algebra 2', 'AP Precalculus'].map(subject => (
                                <label key={subject} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9em' }}>
                                    <input
                                        type="checkbox"
                                        checked={newGroupSession.subjects.includes(subject)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setNewGroupSession({
                                                    ...newGroupSession,
                                                    subjects: [...newGroupSession.subjects, subject]
                                            });
                                            } else {
                                                setNewGroupSession({
                                                    ...newGroupSession,
                                                    subjects: newGroupSession.subjects.filter(s => s !== subject)
                                            });
                                            }
                                        }}
                                    />
                                    {subject}
                                </label>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9em', color: 'var(--text-secondary)' }}>Room Assignment</label>
                        <input
                            type="text"
                            placeholder="e.g., N318"
                            value={newGroupSession.roomAssignment}
                            onChange={(e) => setNewGroupSession({ ...newGroupSession, roomAssignment: e.target.value })}
                            required
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9em', color: 'var(--text-secondary)' }}>Teacher Name</label>
                        <input
                            type="text"
                            placeholder="Teacher name"
                            value={newGroupSession.teacherName}
                            onChange={(e) => setNewGroupSession({ ...newGroupSession, teacherName: e.target.value })}
                            required
                        />
                    </div>
                </div>

                <button type="submit" style={{ gridColumn: '1 / -1', marginTop: '15px' }}>Add Group Tutoring Session</button>
            </form>

            <h3>Manage Group Tutoring Sessions</h3>
            <div className="tutor-manage-list">
                {groupSessions.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)' }}>No group tutoring sessions yet</p>
                ) : (
                    groupSessions.map(session => (
                        <div key={session.id} className="tutor-manage-item">
                            <div>
                                <strong>{session.session_time}</strong>
                                <p style={{ margin: '5px 0 0 0', fontSize: '0.85em', color: 'var(--text-secondary)' }}>
                                    {new Date(session.session_date).toLocaleDateString()} • {session.room_assignment}
                                </p>
                                <p style={{ margin: '5px 0 0 0', fontSize: '0.8em', color: 'var(--text-secondary)' }}>
                                    Subjects: {session.subjects && session.subjects.length > 0 ? session.subjects.join(', ') : 'None'}
                                </p>
                            </div>
                            <button
                                onClick={() => handleDeleteGroupSession(session.id)}
                                className="delete-button"
                            >
                                Delete
                            </button>
                        </div>
                    ))
                )}
            </div>

            <hr />

            <h3>Group Tutoring Registrations</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
                View all student registrations for group tutoring sessions
            </p>

            <div className="registrations-list">
                <table>
                    <thead>
                        <tr>
                            <th>Student Name</th>
                            <th>Email</th>
                            <th>Subject</th>
                            <th>Help Level</th>
                            <th>Previous Programs</th>
                            <th>Room Assignment</th>
                            <th>Registered</th>
                        </tr>
                    </thead>
                    <tbody>
                        {groupTutoringRegistrations.length === 0 ? (
                            <tr>
                                <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                                    No registrations yet
                                </td>
                            </tr>
                        ) : (
                            groupTutoringRegistrations.map(reg => (
                                <tr key={reg.id}>
                                    <td>{reg.full_name}</td>
                                    <td>{reg.school_email}</td>
                                    <td>{reg.subject}</td>
                                    <td style={{ fontSize: '0.85em' }}>
                                        {reg.help_needed === "A lot! I don't understand at all." ? 'A lot' :
                                         reg.help_needed === "Some. I understand some concepts, but I get stuck on lots of problems." ? 'Some' :
                                         'Not much'}
                                    </td>
                                    <td style={{ fontSize: '0.85em' }}>
                                        {reg.previous_programs && reg.previous_programs.length > 0 
                                            ? reg.previous_programs.join(', ') 
                                            : 'None'}
                                    </td>
                                    <td><strong>{reg.room_assignment}</strong></td>
                                    <td>{new Date(reg.registered_at).toLocaleDateString()}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <hr />

            <h3>Manage Tutors</h3>
            <div className="tutor-manage-list">
                {tutors.map(tutor => (
                    <div key={tutor.id} className="tutor-manage-item">
                        <span>{tutor.name}</span>
                        <div className="tutor-manage-buttons">
                            <button
                                onClick={() => setEditingTutor(tutor)}
                                className="edit-button"
                            >
                                Edit
                            </button>
                            <button
                                onClick={() => handleDelete(tutor.id)}
                                className="delete-button"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <h3>Pending Approvals</h3>
            <div className="vetting-list">
                {tutors.filter(t => !t.is_approved).map(tutor => (
                    <div key={tutor.id} className="tutor-manage-item">
                        <span>{tutor.name} ({tutor.subjects})</span>
                        <button
                            onClick={() => handleApprove(tutor.id)}
                            className="edit-button"
                            style={{ backgroundColor: '#28a745' }}
                        >
                            Approve
                        </button>
                    </div>
                ))}
            </div>

            <EditModal
                tutor={editingTutor}
                onClose={() => setEditingTutor(null)}
                onUpdated={onTutorAdded}
            />

            <hr />

            <h3>Manage Approved Roles</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
                Add emails here to allow them to register as Admin or Tutor. Everyone else defaults to Learner.
            </p>

            <form onSubmit={handleAddAllowedRole} style={{ marginBottom: '20px' }}>
                <input
                    type="email"
                    placeholder="Email to approve"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    required
                />

                <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    required
                >
                    <option value="tutor">Tutor</option>
                    <option value="admin">Admin</option>
                </select>

                <button type="submit">Approve Email</button>
            </form>

            <div className="tutor-manage-list">
                {allowedRoles.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)' }}>No approved roles yet</p>
                ) : (
                    allowedRoles.map(ar => (
                        <div key={ar.id} className="tutor-manage-item">
                            <div>
                                <strong>{ar.email}</strong>
                                <p style={{ margin: '5px 0 0 0', fontSize: '0.85em', color: 'var(--text-secondary)' }}>
                                    Role: <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{ar.role}</span>
                                </p>
                            </div>
                            <button
                                onClick={() => handleRemoveAllowedRole(ar.id)}
                                className="delete-button"
                            >
                                Remove
                            </button>
                        </div>
                    ))
                )}
            </div>

            <hr />

            <h3>All User Accounts</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
                Database of all registered users
            </p>

            <div className="registrations-list">
                <table>
                    <thead>
                        <tr>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Joined</th>
                        </tr>
                    </thead>
                    <tbody>
                        {allUsers.length === 0 ? (
                            <tr>
                                <td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                                    No users yet
                                </td>
                            </tr>
                        ) : (
                            allUsers.map(user => (
                                <tr key={user.id}>
                                    <td>{user.email}</td>
                                    <td>
                                        <span style={{
                                            textTransform: 'capitalize',
                                            fontWeight: 600,
                                            padding: '4px 8px',
                                            borderRadius: '4px',
                                            backgroundColor: user.role === 'admin' ? 'rgba(220, 38, 38, 0.1)' : 
                                                            user.role === 'tutor' ? 'rgba(37, 99, 235, 0.1)' : 
                                                            'rgba(156, 163, 175, 0.1)',
                                            color: user.role === 'admin' ? 'var(--accent-danger)' : 
                                                  user.role === 'tutor' ? 'var(--accent-primary)' : 
                                                  'var(--text-secondary)'
                                        }}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td>{new Date(user.created_at).toLocaleDateString()}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default AdminPanel;