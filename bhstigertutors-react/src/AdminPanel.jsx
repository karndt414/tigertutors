import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import ImageUpload from './ImageUpload'; 
import EditModal from './EditModal';
import './AdminPanel.css';

const FLEX_SCHEDULE = {
  '6.2': 3,  // Tuesday
  '6.3': 5,  // Thursday
  '6.4': 5,  // Thursday
  '6.5': 6,  // Friday
  '6.6': 6   // Friday
};

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function AdminPanel({ tutors, onTutorAdded }) {
    const [editingTutor, setEditingTutor] = useState(null);
    const [allowedRoles, setAllowedRoles] = useState([]);
    const [newEmail, setNewEmail] = useState('');
    const [newRole, setNewRole] = useState('tutor');
    const [user, setUser] = useState(null);
    const [allUsers, setAllUsers] = useState([]);
    const [groupSessions, setGroupSessions] = useState([]);
    const [newGroupSession, setNewGroupSession] = useState({
        sessionDate: '',
        roomAssignment: '',
        teacherName: '',
        buttonColor: '#3b82f6',
        buttonLabel: ''
    });
    const [groupTutoringRegistrations, setGroupTutoringRegistrations] = useState([]);
    const [expandedRegistrations, setExpandedRegistrations] = useState({});
    const [homePageContent, setHomePageContent] = useState('');
    const [aboutPageContent, setAboutPageContent] = useState('');
    const [editingPage, setEditingPage] = useState(null);
    const [contactPageContent, setContactPageContent] = useState('');
    const [groupTutoringContent, setGroupTutoringContent] = useState('');
    const [groupTutoringTutorContent, setGroupTutoringTutorContent] = useState('');
    const [selectedText, setSelectedText] = useState('');
    const [editingPageType, setEditingPageType] = useState(null);
    const [tutoringLeadEmail, setTutoringLeadEmail] = useState('wolfkame@bentonvillek12.org');
    const [newTutoringLeadEmail, setNewTutoringLeadEmail] = useState('');
    const [mathSubjects, setMathSubjects] = useState([]);
    const [newSubject, setNewSubject] = useState('');
    const [studentPresidentEmail, setStudentPresidentEmail] = useState('');
    const [newStudentPresidentEmail, setNewStudentPresidentEmail] = useState('');
    const [pendingTutorRequests, setPendingTutorRequests] = useState([]);
    const [expandedSections, setExpandedSections] = useState({
        groupSessions: true,
        manageSessions: false,
        registrations: false,
        tutors: false,
        approvedRoles: false,
        pendingTutors: false,
        userAccounts: false,
        pageContent: false,
        siteConfig: false,
        archivedSessions: false
    });
    const [archivedSessions, setArchivedSessions] = useState([]);

    useEffect(() => {
        // Just fetch data directly
        fetchAllowedRoles();
        fetchAllUsers();
        fetchGroupSessions();
        fetchGroupTutoringRegistrations();
        fetchPageContent();
        fetchTutoringLeadEmail();
        fetchStudentPresidentEmail();
        fetchMathSubjects();
        fetchPendingTutorRequests();
        fetchArchivedSessions();
    }, []);

    const handleDelete = async (tutorId) => {
        if (!window.confirm('Are you sure you want to delete this tutor?')) {
            return;
        }

        try {
            const { error } = await supabase
                .from('tutors')
                .delete()
                .eq('id', tutorId);

            if (error) {
                console.error('Delete error:', error);
                alert('Error deleting tutor: ' + error.message);
                return;
            }

            alert('Tutor deleted.');
            onTutorAdded();  // This should refresh the tutors list
        } catch (err) {
            console.error('Unexpected error:', err);
            alert('Error deleting tutor');
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
            .select(`
            *,
            group_tutoring_registrations (
                id,
                full_name,
                school_email,
                subject,
                help_needed,
                registered_at
            )
        `)
            .eq('is_archived', false)
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
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                console.error('No user logged in');
                return;
            }

            // Check if user is admin first
            const { data: roleData, error: roleError } = await supabase
                .from('users')
                .select('role')
                .eq('id', user.id)
                .single();

            if (roleError || roleData?.role !== 'admin') {
                console.error('Not an admin');
                return;
            }

            // Now fetch users
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching users:', error.message);
                return;
            }

            // Custom sort: admin → tutor → learner
            const roleOrder = { admin: 0, tutor: 1, learner: 2 };
            const sorted = (data || []).sort((a, b) => roleOrder[a.role] - roleOrder[b.role]);
            setAllUsers(sorted);
        } catch (err) {
            console.error('Fetch error:', err);
        }
    };

    const fetchGroupTutoringRegistrations = async () => {
        const { data, error } = await supabase
            .from('group_tutoring_registrations')
            .select(`
                *,
                group_tutoring_sessions (
                    id,
                    session_date,
                    session_time,
                    room_assignment
                )
            `)
            .order('registered_at', { ascending: false });
        
        if (error) {
            console.error(error);
            return;
        }

        // Fetch all users to map emails to roles
        const { data: usersData } = await supabase
            .from('users')
            .select('email, role');

        // Add user role info to registrations
        const enrichedData = (data || []).map(reg => ({
            ...reg,
            userRole: usersData?.find(u => u.email === reg.school_email)?.role
        }));

        setGroupTutoringRegistrations(enrichedData);
    };

    const fetchPageContent = async () => {
        const { data: homeData } = await supabase
            .from('page_content')
            .select('content')
            .eq('page_name', 'home')
            .single();
        
        const { data: aboutData } = await supabase
            .from('page_content')
            .select('content')
            .eq('page_name', 'about')
            .single();

        const { data: groupData } = await supabase
            .from('page_content')
            .select('content')
            .eq('page_name', 'group_tutoring')
            .single();

        const { data: contactData } = await supabase
            .from('page_content')
            .select('content')
            .eq('page_name', 'contact')
            .single();

        const { data: groupTutorData } = await supabase
            .from('page_content')
            .select('content')
            .eq('page_name', 'group_tutoring_tutor')
            .single();

        if (homeData) setHomePageContent(homeData.content);
        if (aboutData) setAboutPageContent(aboutData.content);
        if (groupData) setGroupTutoringContent(groupData.content);
        if (contactData) setContactPageContent(contactData.content);
        if (groupTutorData) setGroupTutoringTutorContent(groupTutorData.content);
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
                approved_by: user?.email || 'admin@system'
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

    const getFlexPeriodFromDate = (dateString) => {
        // Parse date in local timezone (not UTC)
        const [year, month, day] = dateString.split('-');
        const date = new Date(year, month - 1, day);
        let dayOfWeek = date.getDay();
        dayOfWeek = (dayOfWeek + 1) % 7;  // Add 1 to shift all days
        
        switch(dayOfWeek) {
            case 3: return '6.2';  // Tuesday
            case 5: return '6.3';  // Thursday (default to 6.3, user can pick 6.4)
            case 6: return '6.5';  // Friday (default to 6.5, user can pick 6.6)
            default: return '';
        }
    };

    const handleAddGroupSession = async (e) => {
        e.preventDefault();

        if (!newGroupSession.sessionDate || !newGroupSession.roomAssignment || !newGroupSession.teacherName) {
            alert('Please fill in all fields');
            return;
        }

        // Parse date in local timezone (not UTC)
        const [year, month, day] = newGroupSession.sessionDate.split('-');
        const sessionDate = new Date(year, month - 1, day);
        let dayOfWeek = sessionDate.getDay();
        dayOfWeek = (dayOfWeek + 1) % 7;  // Add 1 to shift all days
        
        // Only allow Tuesday, Thursday, Friday
        if (![3, 5, 6].includes(dayOfWeek)) {
            alert('Group tutoring sessions can only be on Tuesday, Thursday, or Friday');
            return;
        }

        const allSubjects = ['Pre-AP Geometry', 'Geometry', 'Advanced Algebra 2', 'Algebra 2', 'AP Precalculus'];

        const { error } = await supabase
            .from('group_tutoring_sessions')
            .insert({
                session_date: newGroupSession.sessionDate,
                session_time: newGroupSession.sessionTime,
                subjects: allSubjects,
                room_assignment: newGroupSession.roomAssignment,
                teacher_name: newGroupSession.teacherName,
                button_label: newGroupSession.buttonLabel || newGroupSession.sessionTime,
                button_color: newGroupSession.buttonColor
            });

        if (error) {
            alert('Error adding session: ' + error.message);
        } else {
            alert('Group tutoring session added!');
            setNewGroupSession({
                sessionDate: '',
                roomAssignment: '',
                teacherName: '',
                buttonColor: '#3b82f6',
                buttonLabel: ''
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

    const handleArchiveSession = async (sessionId) => {
        if (!window.confirm('Archive this session?')) return;

        const { error } = await supabase
            .from('group_tutoring_sessions')
            .update({ is_archived: true })
            .eq('id', sessionId);

        if (error) {
            alert('Error: ' + error.message);
        } else {
            alert('Session archived');
            fetchGroupSessions();
            fetchArchivedSessions();
        }
    };

    const handleUnarchiveSession = async (sessionId) => {
        if (!window.confirm('Restore this session?')) return;

        const { error } = await supabase
            .from('group_tutoring_sessions')
            .update({ is_archived: false })
            .eq('id', sessionId);

        if (error) {
            alert('Error: ' + error.message);
        } else {
            alert('Session restored');
            fetchGroupSessions();
            fetchArchivedSessions();
        }
    };

    const fetchArchivedSessions = async () => {
        const { data, error } = await supabase
            .from('group_tutoring_sessions')
            .select(`
                *,
                group_tutoring_registrations (
                    id,
                    full_name,
                    school_email,
                    subject,
                    help_needed,
                    registered_at
                )
            `)
            .eq('is_archived', true)
            .order('session_date', { ascending: false });
        
        if (error) console.error(error);
        else setArchivedSessions(data || []);
    };

    const fetchTutoringLeadEmail = async () => {
        const { data } = await supabase
            .from('site_config')
            .select('value')
            .eq('key', 'tutoring_lead_email')
            .single();
        
        if (data) {
            setTutoringLeadEmail(data.value);
            setNewTutoringLeadEmail(data.value);
        }
    };

    const handleUpdateTutoringLeadEmail = async (e) => {
        e.preventDefault();
        
        if (!newTutoringLeadEmail.trim()) {
            alert('Please enter an email');
            return;
        }

        const { error } = await supabase
            .from('site_config')
            .upsert({
                key: 'tutoring_lead_email',
                value: newTutoringLeadEmail,
                updated_at: new Date().toISOString()
            }, { onConflict: 'key' });

        if (error) {
            alert('Error updating email: ' + error.message);
        } else {
            alert('Tutoring lead email updated!');
            setTutoringLeadEmail(newTutoringLeadEmail);
        }
    };

    const fetchStudentPresidentEmail = async () => {
        const { data } = await supabase
            .from('site_config')
            .select('value')
            .eq('key', 'student_president_email')
            .single();
        
        if (data) {
            setStudentPresidentEmail(data.value);
            setNewStudentPresidentEmail(data.value);
        }
    };

    const handleUpdateStudentPresidentEmail = async (e) => {
        e.preventDefault();
        
        if (!newStudentPresidentEmail.trim()) {
            alert('Please enter an email');
            return;
        }

        const { error } = await supabase
            .from('site_config')
            .upsert({
                key: 'student_president_email',
                value: newStudentPresidentEmail,
                updated_at: new Date().toISOString()
            }, { onConflict: 'key' });

        if (error) {
            alert('Error updating email: ' + error.message);
        } else {
            alert('Student president email updated!');
            setStudentPresidentEmail(newStudentPresidentEmail);
        }
    };

    const fetchMathSubjects = async () => {
        const { data, error } = await supabase
            .from('site_config')
            .select('value')
            .eq('key', 'math_subjects')
            .single();
        
        if (data && data.value) {
            setMathSubjects(JSON.parse(data.value));
        } else {
            // Default subjects
            setMathSubjects(['Pre-AP Geometry', 'Geometry', 'Advanced Algebra 2', 'Algebra 2', 'AP Precalculus']);
        }
    };

    const handleAddSubject = async (e) => {
        e.preventDefault();
        
        if (!newSubject.trim()) {
            alert('Please enter a subject');
            return;
        }

        if (mathSubjects.includes(newSubject)) {
            alert('Subject already exists');
            return;
        }

        const updatedSubjects = [...mathSubjects, newSubject];
        
        const { error } = await supabase
            .from('site_config')
            .upsert({
                key: 'math_subjects',
                value: JSON.stringify(updatedSubjects),
                updated_at: new Date().toISOString()
            }, { onConflict: 'key' });

        if (error) {
            alert('Error adding subject: ' + error.message);
        } else {
            alert('Subject added!');
            setMathSubjects(updatedSubjects);
            setNewSubject('');
        }
    };

    const handleRemoveSubject = async (subject) => {
        if (!window.confirm(`Remove "${subject}"?`)) return;

        const updatedSubjects = mathSubjects.filter(s => s !== subject);
        
        const { error } = await supabase
            .from('site_config')
            .upsert({
                key: 'math_subjects',
                value: JSON.stringify(updatedSubjects),
                updated_at: new Date().toISOString()
            }, { onConflict: 'key' });

        if (error) {
            alert('Error removing subject: ' + error.message);
        } else {
            alert('Subject removed');
            setMathSubjects(updatedSubjects);
        }
    };

    const fetchPendingTutorRequests = async () => {
        const { data, error } = await supabase
            .from('site_config')
            .select('value')
            .eq('key', 'pending_tutor_requests')
            .single();
        
        if (data && data.value) {
            setPendingTutorRequests(JSON.parse(data.value));
        } else {
            setPendingTutorRequests([]);
        }
    };

    const handleApprovePendingTutor = async (email) => {
        try {
            // Add to allowed_roles
            const { error: roleError } = await supabase
                .from('allowed_roles')
                .insert({
                    email: email.toLowerCase(),
                    role: 'tutor',
                    approved_by: user?.email || 'admin@system'
                });

            if (roleError && roleError.code !== '23505') {
                alert('Error approving tutor: ' + roleError.message);
                return;
            }

            // Create user account for the tutor
            try {
                await fetch('/api/create-tutor-user', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        tutorEmail: email.toLowerCase(),
                        role: 'tutor'
                    })
                });
            } catch (userErr) {
                console.error('Error creating user account:', userErr);
                alert('Warning: Tutor added to allowed roles but user account creation may have failed');
            }

            // Send approval email to tutor
            try {
                await fetch('/api/send-tutor-approved-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        tutorEmail: email.toLowerCase()
                    })
                });
            } catch (emailErr) {
                console.error('Error sending approval email:', emailErr);
            }

            // Remove from pending requests
            const updatedRequests = pendingTutorRequests.filter(req => req.email !== email);

            const { error: configError } = await supabase
                .from('site_config')
                .upsert({
                    key: 'pending_tutor_requests',
                    value: JSON.stringify(updatedRequests),
                    updated_at: new Date().toISOString()
                }, { onConflict: 'key' });

            if (configError) {
                alert('Error updating requests: ' + configError.message);
            } else {
                alert(`${email} approved as tutor!`);
                setPendingTutorRequests(updatedRequests);
                fetchAllowedRoles();
                fetchAllUsers();
            }
        } catch (err) {
            console.error('Approval error:', err);
            alert('Error approving tutor');
        }
    };

    const handleDenyPendingTutor = async (email) => {
        if (!window.confirm(`Deny tutor request for ${email}?`)) return;

        const updatedRequests = pendingTutorRequests.filter(req => req.email !== email);
        
        const { error } = await supabase
            .from('site_config')
            .upsert({
                key: 'pending_tutor_requests',
                value: JSON.stringify(updatedRequests),
                updated_at: new Date().toISOString()
            }, { onConflict: 'key' });

        if (error) {
            alert('Error: ' + error.message);
        } else {
            alert('Tutor request denied');
            setPendingTutorRequests(updatedRequests);
        }
    };

    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const parseMarkdown = (text) => {
        if (!text) return '';
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/__(.*?)__/g, '<u>$1</u>')
            .replace(/\{\{tutoring_lead_email\}\}/g, tutoringLeadEmail);
    };

    const handleTextareaSelect = (e) => {
        setSelectedText(e.target.value.substring(e.target.selectionStart, e.target.selectionEnd));
    };

    const applyFormatting = (type) => {
        if (!selectedText) return;

        let formatted = '';
        if (type === 'bold') formatted = `**${selectedText}**`;
        else if (type === 'italic') formatted = `*${selectedText}*`;
        else if (type === 'underline') formatted = `__${selectedText}__`;

        if (editingPageType === 'home') {
            setHomePageContent(homePageContent.replace(selectedText, formatted));
        } else if (editingPageType === 'about') {
            setAboutPageContent(aboutPageContent.replace(selectedText, formatted));
        } else if (editingPageType === 'group_tutoring') {
            setGroupTutoringContent(groupTutoringContent.replace(selectedText, formatted));
        } else if (editingPageType === 'group_tutoring_tutor') {
            setGroupTutoringTutorContent(groupTutoringTutorContent.replace(selectedText, formatted));
        } else if (editingPageType === 'contact') {
            setContactPageContent(contactPageContent.replace(selectedText, formatted));
        }
        setSelectedText('');
    };

    const handleSavePageContent = async (pageName, content) => {
        const { error } = await supabase
            .from('page_content')
            .upsert({
                page_name: pageName,
                content: content,
                updated_at: new Date().toISOString()
            }, { onConflict: 'page_name' });

        if (error) {
            alert('Error saving content: ' + error.message);
        } else {
            alert('Content saved!');
            setEditingPage(null);
        }
    };

    const handleDeleteUser = async (userId, email) => {
        if (!window.confirm(`Delete user ${email}?`)) return;

        const { error } = await supabase
            .from('users')
            .delete()
            .eq('id', userId);

        if (error) {
            alert('Error: ' + error.message);
        } else {
            alert('User deleted');
            fetchAllUsers();
        }
    };

    const handleDeleteRegistration = async (registrationId) => {
        if (!window.confirm('Remove this registration?')) return;

        const { error } = await supabase
            .from('group_tutoring_registrations')
            .delete()
            .eq('id', registrationId);

        if (error) {
            alert('Error: ' + error.message);
        } else {
            alert('Registration removed');
            fetchGroupSessions();
            fetchGroupTutoringRegistrations();
        }
    };

    return (
        <div className="admin-panel">
            <div style={{
                background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
                padding: '3rem 2rem',
                borderRadius: '12px',
                marginBottom: '2rem',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Overlay for better contrast */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.2)',
                    borderRadius: '12px'
                }}></div>

                <div style={{ position: 'relative', zIndex: 1 }}>
                    <h1 style={{
                        fontSize: '2.5rem',
                        fontWeight: 700,
                        color: 'white',
                        margin: '0 0 0.5rem 0',
                        letterSpacing: '0.5px',
                        textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                    }}>
                        ⚙️ Admin Panel
                    </h1>
                    <p style={{
                        fontSize: '1rem',
                        color: 'rgba(255, 255, 255, 0.95)',
                        margin: '0',
                        fontWeight: 300,
                        textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
                    }}>
                        Manage tutors, sessions, users, and site content
                    </p>
                </div>
            </div>

            <hr />

            {/* Group Tutoring Sessions */}
            <div>
                <h3 
                    onClick={() => toggleSection('groupSessions')}
                    style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
                >
                    {expandedSections.groupSessions ? '▼' : '▶'} Create Group Tutoring Sessions
                </h3>
                {expandedSections.groupSessions && (
                    <form onSubmit={handleAddGroupSession} style={{ marginBottom: '20px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9em', color: 'var(--text-secondary)' }}>Session Date</label>
                                <input
                                    type="date"
                                    value={newGroupSession.sessionDate}
                                    onChange={(e) => {
                                        const flexPeriod = getFlexPeriodFromDate(e.target.value);
                                        setNewGroupSession({ 
                                            ...newGroupSession, 
                                            sessionDate: e.target.value,
                                            sessionTime: flexPeriod
                                        });
                                    }}
                                    required
                                />
                                {newGroupSession.sessionDate && (
                                    <p style={{ margin: '10px 0 0 0', fontSize: '0.85em', color: 'var(--text-secondary)' }}>
                                        Selected: {(() => {
                                            const [year, month, day] = newGroupSession.sessionDate.split('-');
                                            const date = new Date(year, month - 1, day);
                                            return date.toLocaleDateString('en-US', { weekday: 'long' });
                                        })()}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9em', color: 'var(--text-secondary)' }}>Flex Period</label>
                                <select
                                    value={newGroupSession.sessionTime}
                                    onChange={(e) => setNewGroupSession({ ...newGroupSession, sessionTime: e.target.value })}
                                    required
                                >
                                    <option value="">Select flex period</option>
                                    {newGroupSession.sessionDate && (
                                        (() => {
                                            // Parse date in local timezone (not UTC)
                                            const [year, month, day] = newGroupSession.sessionDate.split('-');
                                            const date = new Date(year, month - 1, day);
                                            let dayOfWeek = date.getDay();
                                            dayOfWeek = (dayOfWeek + 1) % 7;
                                            
                                            if (dayOfWeek === 3) return <option key="6.2" value="6.2">6.2</option>;
                                            if (dayOfWeek === 5) return (
                                                <>
                                                    <option key="6.3" value="6.3">6.3</option>
                                                    <option key="6.4" value="6.4">6.4</option>
                                                </>
                                            );
                                            if (dayOfWeek === 6) return (
                                                <>
                                                    <option key="6.5" value="6.5">6.5</option>
                                                    <option key="6.6" value="6.6">6.6</option>
                                                </>
                                            );
                                            return <option disabled>Invalid day</option>;
                                        })()
                                    )}
                                </select>
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

                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9em', color: 'var(--text-secondary)' }}>Button Label (optional)</label>
                                <input
                                    type="text"
                                    placeholder="e.g., ACT Prep"
                                    value={newGroupSession.buttonLabel}
                                    onChange={(e) => setNewGroupSession({ ...newGroupSession, buttonLabel: e.target.value })}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9em', color: 'var(--text-secondary)' }}>Button Color</label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <input
                                        type="color"
                                        value={newGroupSession.buttonColor}
                                        onChange={(e) => setNewGroupSession({ ...newGroupSession, buttonColor: e.target.value })}
                                        style={{ width: '50px', height: '36px', cursor: 'pointer', borderRadius: '4px' }}
                                    />
                                </div>
                            </div>
                        </div>

                        <button type="submit" style={{ gridColumn: '1 / -1', marginTop: '15px' }}>Add Group Tutoring Session</button>
                    </form>
                )}
            </div>

            <hr />

            {/* Manage Group Tutoring Sessions */}
            <div>
                <h3
                    onClick={() => toggleSection('manageSessions')}
                    style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {expandedSections.manageSessions ? '▼' : '▶'} Manage Group Tutoring Sessions
                    </span>
                    <span style={{
                        backgroundColor: 'var(--accent-primary)',
                        color: 'white',
                        borderRadius: '50%',
                        width: '28px',
                        height: '28px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.85em',
                        fontWeight: 600
                    }}>
                        {groupSessions.length}
                    </span>
                </h3>
                {expandedSections.manageSessions && (
                    <div className="sessions-manage-list">
                        {groupSessions.length === 0 ? (
                            <p style={{ color: 'var(--text-secondary)' }}>No group tutoring sessions yet</p>
                        ) : (
                                groupSessions.map(session => {
                                    const learnerCount = session.group_tutoring_registrations?.filter(reg => reg.subject !== 'Tutor').length || 0;
                                    const tutorCount = session.group_tutoring_registrations?.filter(reg => reg.subject === 'Tutor').length || 0;
                                    const isExpanded = expandedRegistrations[session.id];

                                    return (
                                        <div key={session.id} style={{
                                            border: '1px solid var(--border-color)',
                                            borderRadius: '8px',
                                            padding: '20px',
                                            marginBottom: '20px',
                                            backgroundColor: 'var(--bg-secondary)'
                                        }}>
                                            {/* Session Header */}
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'start',
                                                marginBottom: '15px',
                                                gap: '10px'
                                            }}>
                                                <div>
                                                    <strong style={{ fontSize: '1.1em' }}>{session.session_time}</strong>
                                                    <p style={{ margin: '5px 0 0 0', fontSize: '0.85em', color: 'var(--text-secondary)' }}>
                                                        {new Date(session.session_date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })} • {session.room_assignment}
                                                    </p>
                                                    <p style={{ margin: '5px 0 0 0', fontSize: '0.8em', color: 'var(--text-secondary)' }}>
                                                        👨‍🏫 {session.teacher_name}
                                                    </p>
                                                    <p style={{ margin: '5px 0 0 0', fontSize: '0.8em', color: 'var(--accent-primary)', fontWeight: 600 }}>
                                                        👥 {learnerCount} learners | 👨‍🏫 {tutorCount} tutors
                                                    </p>
                                                </div>
                                                <div style={{ display: 'flex', gap: '8px', alignSelf: 'flex-start' }}>
                                                    <button
                                                        onClick={() => handleArchiveSession(session.id)}
                                                        className="edit-button"
                                                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.8em' }}
                                                    >
                                                        Archive
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteGroupSession(session.id)}
                                                        className="delete-button"
                                                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.8em' }}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>

                                        {/* Registrations Dropdown */}
                                        <button
                                            onClick={() => setExpandedRegistrations(prev => ({
                                                ...prev,
                                                [session.id]: !prev[session.id]
                                            }))}
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                marginTop: '15px',
                                                backgroundColor: 'var(--bg-tertiary)',
                                                border: '1px solid var(--border-color)',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                fontWeight: 600,
                                                color: 'var(--text-primary)'
                                            }}
                                        >
                                            <span>Registrations ({learnerCount})</span>
                                            <span>{isExpanded ? '▼' : '▶'}</span>
                                        </button>

                                        {/* Registrations Table */}
                                            {isExpanded && (
                                                <div style={{
                                                    marginTop: '15px',
                                                    paddingTop: '15px',
                                                    borderTop: '1px solid var(--border-color)'
                                                }}>
                                                    {session.group_tutoring_registrations && session.group_tutoring_registrations.length > 0 ? (
                                                        <table style={{
                                                            width: '100%',
                                                            borderCollapse: 'collapse',
                                                            fontSize: '0.9em'
                                                        }}>
                                                            <thead>
                                                                <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                                                                    <th style={{ textAlign: 'left', padding: '8px 0' }}>Name</th>
                                                                    <th style={{ textAlign: 'left', padding: '8px 0' }}>Email</th>
                                                                    <th style={{ textAlign: 'left', padding: '8px 0' }}>Subject</th>
                                                                    <th style={{ textAlign: 'left', padding: '8px 0' }}>Help Level</th>
                                                                    <th style={{ textAlign: 'left', padding: '8px 0' }}>Actions</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {[...session.group_tutoring_registrations]
                                                                    .sort((a, b) => {
                                                                        // Tutors first, then learners
                                                                        if (a.subject === 'Tutor' && b.subject !== 'Tutor') return -1;
                                                                        if (a.subject !== 'Tutor' && b.subject === 'Tutor') return 1;
                                                                        return 0;
                                                                    })
                                                                    .map(reg => (
                                                                        <tr key={reg.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                                            <td style={{ padding: '8px 0' }}>{reg.full_name}</td>
                                                                            <td style={{ padding: '8px 0', fontSize: '0.85em', color: 'var(--text-secondary)' }}>{reg.school_email}</td>
                                                                            <td style={{ padding: '8px 0' }}>{reg.subject}</td>
                                                                            <td style={{ padding: '8px 0', fontSize: '0.8em' }}>
                                                                                {reg.subject === 'Tutor' ? '👨‍🏫 Tutor' :
                                                                                    reg.help_needed === "A lot! I don't understand at all." ? '🔴 A lot' :
                                                                                        reg.help_needed === "Some. I understand some concepts, but I get stuck on lots of problems." ? '🟡 Some' :
                                                                                            '🟢 Not much'}
                                                                            </td>
                                                                            <td style={{ padding: '8px 0' }}>
                                                                                <button
                                                                                    onClick={() => handleDeleteRegistration(reg.id)}
                                                                                    className="delete-button"
                                                                                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.8em' }}
                                                                                >
                                                                                    Remove
                                                                                </button>
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                            </tbody>
                                                        </table>
                                                    ) : (
                                                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9em' }}>No registrations for this session</p>
                                                    )}
                                                </div>
                                            )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}
            </div>

            <hr />

            {/* Manage Tutors */}
            <div>
                <h3
                    onClick={() => toggleSection('tutors')}
                    style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {expandedSections.tutors ? '▼' : '▶'} Manage Tutors
                    </span>
                    <span style={{
                        backgroundColor: 'var(--accent-primary)',
                        color: 'white',
                        borderRadius: '50%',
                        width: '28px',
                        height: '28px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.85em',
                        fontWeight: 600
                    }}>
                        {tutors.length}
                    </span>
                </h3>
                {expandedSections.tutors && (
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
                )}
            </div>

            <EditModal
                tutor={editingTutor}
                onClose={() => setEditingTutor(null)}
                onUpdated={onTutorAdded}
            />

            <hr />

            {/* Manage Approved Roles */}
            <div>
                <h3 
                    onClick={() => toggleSection('approvedRoles')}
                    style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
                >
                    {expandedSections.approvedRoles ? '▼' : '▶'} Manage Approved Roles
                </h3>
                {expandedSections.approvedRoles && (
                    <>
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
                    </>
                )}
            </div>

            <hr />

            {/* Pending Tutor Approvals */}
            <div>
                <h3
                    onClick={() => toggleSection('pendingTutors')}
                    style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {expandedSections.pendingTutors ? '▼' : '▶'} Pending Tutor Approvals
                    </span>
                    <span style={{
                        backgroundColor: 'var(--accent-danger)',
                        color: 'white',
                        borderRadius: '50%',
                        width: '28px',
                        height: '28px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.85em',
                        fontWeight: 600
                    }}>
                        {pendingTutorRequests.length}
                    </span>
                </h3>
                {expandedSections.pendingTutors && (
                    <>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
                            Tutors waiting for approval
                        </p>
                        <div className="tutor-manage-list">
                            {pendingTutorRequests.length === 0 ? (
                                <p style={{ color: 'var(--text-secondary)' }}>No pending tutor requests</p>
                            ) : (
                                pendingTutorRequests.map((request, index) => (
                                    <div key={index} className="tutor-manage-item">
                                        <div>
                                            <strong>{request.email}</strong>
                                            <p style={{ margin: '5px 0 0 0', fontSize: '0.85em', color: 'var(--text-secondary)' }}>
                                                Requested: {new Date(request.timestamp).toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="tutor-manage-buttons">
                                            <button
                                                onClick={() => handleApprovePendingTutor(request.email)}
                                                className="edit-button"
                                                style={{ backgroundColor: 'var(--accent-primary)' }}
                                            >
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => handleDenyPendingTutor(request.email)}
                                                className="delete-button"
                                            >
                                                Deny
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </>
                )}
            </div>

            <hr />

            {/* All User Accounts */}
            <div>
                <h3
                    onClick={() => toggleSection('userAccounts')}
                    style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {expandedSections.userAccounts ? '▼' : '▶'} All User Accounts
                    </span>
                    <span style={{
                        backgroundColor: 'var(--accent-primary)',
                        color: 'white',
                        borderRadius: '50%',
                        width: '28px',
                        height: '28px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.85em',
                        fontWeight: 600
                    }}>
                        {allUsers.length}
                    </span>
                </h3>
                {expandedSections.userAccounts && (
                    <>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
                            Database of all registered users
                        </p>
                        <div className="table-wrapper">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Email</th>
                                        <th>Role</th>
                                        <th>Joined</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {allUsers.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
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
                                                <td>
                                                    <button
                                                        onClick={() => handleDeleteUser(user.id, user.email)}
                                                        className="delete-button"
                                                    >
                                                        Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>

            <hr />

            {/* Manage Page Content */}
            <div>
                <h3 
                    onClick={() => toggleSection('pageContent')}
                    style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
                >
                    {expandedSections.pageContent ? '▼' : '▶'} Manage Page Content
                </h3>
                {expandedSections.pageContent && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                        <div>
                            <h4>Home Page</h4>
                            {editingPage === 'home' ? (
                                <div>
                                    <div style={{ marginBottom: '10px', display: 'flex', gap: '8px' }}>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setEditingPageType('home');
                                                applyFormatting('bold');
                                            }}
                                            style={{
                                                padding: '6px 12px',
                                                fontWeight: 'bold',
                                                backgroundColor: 'var(--bg-tertiary)',
                                                color: 'var(--text-primary)',
                                                border: '1px solid var(--border-color)',
                                                borderRadius: '4px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <strong>B</strong>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setEditingPageType('home');
                                                applyFormatting('italic');
                                            }}
                                            style={{
                                                padding: '6px 12px',
                                                fontStyle: 'italic',
                                                backgroundColor: 'var(--bg-tertiary)',
                                                color: 'var(--text-primary)',
                                                border: '1px solid var(--border-color)',
                                                borderRadius: '4px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            I
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setEditingPageType('home');
                                                applyFormatting('underline');
                                            }}
                                            style={{
                                                padding: '6px 12px',
                                                textDecoration: 'underline',
                                                backgroundColor: 'var(--bg-tertiary)',
                                                color: 'var(--text-primary)',
                                                border: '1px solid var(--border-color)',
                                                borderRadius: '4px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            U
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setHomePageContent(homePageContent + '{{tutoring_lead_email}}');
                                            }}
                                            style={{
                                                padding: '6px 12px',
                                                backgroundColor: 'var(--bg-tertiary)',
                                                color: 'var(--text-primary)',
                                                border: '1px solid var(--border-color)',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontSize: '0.85em'
                                            }}
                                        >
                                            📧 Insert Email
                                        </button>
                                    </div>
                                    <textarea
                                        value={homePageContent}
                                        onChange={(e) => setHomePageContent(e.target.value)}
                                        onSelect={handleTextareaSelect}
                                        style={{
                                            width: '100%',
                                            minHeight: '200px',
                                            padding: '10px',
                                            backgroundColor: 'var(--bg-primary)',
                                            color: 'var(--text-primary)',
                                            border: '1px solid var(--border-color)',
                                            borderRadius: '6px',
                                            fontFamily: 'monospace'
                                        }}
                                        placeholder="Use **text** for bold, *text* for italic, __text__ for underline, or {{tutoring_lead_email}} to insert the tutoring lead email"
                                    />
                                    <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
                                        <button onClick={() => handleSavePageContent('home', homePageContent)}>Save</button>
                                        <button onClick={() => setEditingPage(null)} style={{ backgroundColor: 'var(--bg-tertiary)' }}>Cancel</button>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <p style={{ color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', marginBottom: '10px' }}>
                                        {parseMarkdown(homePageContent) || 'No content yet'}
                                    </p>
                                    <button onClick={() => {
                                        setEditingPage('home');
                                        setEditingPageType('home');
                                    }}>Edit</button>
                                </div>
                            )}
                        </div>

                        <div>
                            <h4>About Page</h4>
                            {editingPage === 'about' ? (
                                <div>
                                    <div style={{ marginBottom: '10px', display: 'flex', gap: '8px' }}>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setEditingPageType('about');
                                                applyFormatting('bold');
                                            }}
                                            style={{
                                                padding: '6px 12px',
                                                fontWeight: 'bold',
                                                backgroundColor: 'var(--bg-tertiary)',
                                                color: 'var(--text-primary)',
                                                border: '1px solid var(--border-color)',
                                                borderRadius: '4px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <strong>B</strong>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setEditingPageType('about');
                                                applyFormatting('italic');
                                            }}
                                            style={{
                                                padding: '6px 12px',
                                                fontStyle: 'italic',
                                                backgroundColor: 'var(--bg-tertiary)',
                                                color: 'var(--text-primary)',
                                                border: '1px solid var(--border-color)',
                                                borderRadius: '4px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            I
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setEditingPageType('about');
                                                applyFormatting('underline');
                                            }}
                                            style={{
                                                padding: '6px 12px',
                                                textDecoration: 'underline',
                                                backgroundColor: 'var(--bg-tertiary)',
                                                color: 'var(--text-primary)',
                                                border: '1px solid var(--border-color)',
                                                borderRadius: '4px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            U
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setAboutPageContent(aboutPageContent + '{{tutoring_lead_email}}');
                                            }}
                                            style={{
                                                padding: '6px 12px',
                                                backgroundColor: 'var(--bg-tertiary)',
                                                color: 'var(--text-primary)',
                                                border: '1px solid var(--border-color)',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontSize: '0.85em'
                                            }}
                                        >
                                            📧 Insert Email
                                        </button>
                                    </div>
                                    <textarea
                                        value={aboutPageContent}
                                        onChange={(e) => setAboutPageContent(e.target.value)}
                                        onSelect={handleTextareaSelect}
                                        style={{
                                            width: '100%',
                                            minHeight: '200px',
                                            padding: '10px',
                                            backgroundColor: 'var(--bg-primary)',
                                            color: 'var(--text-primary)',
                                            border: '1px solid var(--border-color)',
                                            borderRadius: '6px',
                                            fontFamily: 'monospace'
                                        }}
                                    />
                                    <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
                                        <button onClick={() => handleSavePageContent('about', aboutPageContent)}>Save</button>
                                        <button onClick={() => setEditingPage(null)} style={{ backgroundColor: 'var(--bg-tertiary)' }}>Cancel</button>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <p style={{ color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', marginBottom: '10px' }}>
                                        {parseMarkdown(aboutPageContent) || 'No content yet'}
                                    </p>
                                    <button onClick={() => {
                                        setEditingPage('about');
                                        setEditingPageType('about');
                                    }}>Edit</button>
                                </div>
                            )}
                        </div>

                        <div>
                            <h4>Group Tutoring Page - Learner View</h4>
                            {editingPage === 'group_tutoring' ? (
                                <div>
                                    <div style={{ marginBottom: '10px', display: 'flex', gap: '8px' }}>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setEditingPageType('group_tutoring');
                                                applyFormatting('bold');
                                            }}
                                            style={{
                                                padding: '6px 12px',
                                                fontWeight: 'bold',
                                                backgroundColor: 'var(--bg-tertiary)',
                                                color: 'var(--text-primary)',
                                                border: '1px solid var(--border-color)',
                                                borderRadius: '4px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <strong>B</strong>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setEditingPageType('group_tutoring');
                                                applyFormatting('italic');
                                            }}
                                            style={{
                                                padding: '6px 12px',
                                                fontStyle: 'italic',
                                                backgroundColor: 'var(--bg-tertiary)',
                                                color: 'var(--text-primary)',
                                                border: '1px solid var(--border-color)',
                                                borderRadius: '4px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            I
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setEditingPageType('group_tutoring');
                                                applyFormatting('underline');
                                            }}
                                            style={{
                                                padding: '6px 12px',
                                                textDecoration: 'underline',
                                                backgroundColor: 'var(--bg-tertiary)',
                                                color: 'var(--text-primary)',
                                                border: '1px solid var(--border-color)',
                                                borderRadius: '4px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            U
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setGroupTutoringContent(groupTutoringContent + '{{tutoring_lead_email}}');
                                            }}
                                            style={{
                                                padding: '6px 12px',
                                                backgroundColor: 'var(--bg-tertiary)',
                                                color: 'var(--text-primary)',
                                                border: '1px solid var(--border-color)',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontSize: '0.85em'
                                            }}
                                        >
                                            📧 Insert Email
                                        </button>
                                    </div>
                                    <textarea
                                        value={groupTutoringContent}
                                        onChange={(e) => setGroupTutoringContent(e.target.value)}
                                        onSelect={handleTextareaSelect}
                                        style={{
                                            width: '100%',
                                            minHeight: '200px',
                                            padding: '10px',
                                            backgroundColor: 'var(--bg-primary)',
                                            color: 'var(--text-primary)',
                                            border: '1px solid var(--border-color)',
                                            borderRadius: '6px',
                                            fontFamily: 'monospace'
                                        }}
                                    />
                                    <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
                                        <button onClick={() => handleSavePageContent('group_tutoring', groupTutoringContent)}>Save</button>
                                        <button onClick={() => setEditingPage(null)} style={{ backgroundColor: 'var(--bg-tertiary)' }}>Cancel</button>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <p style={{ color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', marginBottom: '10px', fontSize: '0.85em' }}>
                                        {parseMarkdown(groupTutoringContent) || 'No content yet'}
                                    </p>
                                    <button onClick={() => {
                                        setEditingPage('group_tutoring');
                                        setEditingPageType('group_tutoring');
                                    }}>Edit</button>
                                </div>
                            )}
                        </div>

                        <div>
                            <h4>Group Tutoring Page - Tutor View</h4>
                            {editingPage === 'group_tutoring_tutor' ? (
                                <div>
                                    <div style={{ marginBottom: '10px', display: 'flex', gap: '8px' }}>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setEditingPageType('group_tutoring_tutor');
                                                applyFormatting('bold');
                                            }}
                                            style={{
                                                padding: '6px 12px',
                                                fontWeight: 'bold',
                                                backgroundColor: 'var(--bg-tertiary)',
                                                color: 'var(--text-primary)',
                                                border: '1px solid var(--border-color)',
                                                borderRadius: '4px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <strong>B</strong>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setEditingPageType('group_tutoring_tutor');
                                                applyFormatting('italic');
                                            }}
                                            style={{
                                                padding: '6px 12px',
                                                fontStyle: 'italic',
                                                backgroundColor: 'var(--bg-tertiary)',
                                                color: 'var(--text-primary)',
                                                border: '1px solid var(--border-color)',
                                                borderRadius: '4px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            I
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setEditingPageType('group_tutoring_tutor');
                                                applyFormatting('underline');
                                            }}
                                            style={{
                                                padding: '6px 12px',
                                                textDecoration: 'underline',
                                                backgroundColor: 'var(--bg-tertiary)',
                                                color: 'var(--text-primary)',
                                                border: '1px solid var(--border-color)',
                                                borderRadius: '4px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            U
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setGroupTutoringTutorContent(groupTutoringTutorContent + '{{tutoring_lead_email}}');
                                            }}
                                            style={{
                                                padding: '6px 12px',
                                                backgroundColor: 'var(--bg-tertiary)',
                                                color: 'var(--text-primary)',
                                                border: '1px solid var(--border-color)',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontSize: '0.85em'
                                            }}
                                        >
                                            📧 Insert Email
                                        </button>
                                    </div>
                                    <textarea
                                        value={groupTutoringTutorContent}
                                        onChange={(e) => setGroupTutoringTutorContent(e.target.value)}
                                        onSelect={handleTextareaSelect}
                                        style={{
                                            width: '100%',
                                            minHeight: '200px',
                                            padding: '10px',
                                            backgroundColor: 'var(--bg-primary)',
                                            color: 'var(--text-primary)',
                                            border: '1px solid var(--border-color)',
                                            borderRadius: '6px',
                                            fontFamily: 'monospace'
                                        }}
                                    />
                                    <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
                                        <button onClick={() => handleSavePageContent('group_tutoring_tutor', groupTutoringTutorContent)}>Save</button>
                                        <button onClick={() => setEditingPage(null)} style={{ backgroundColor: 'var(--bg-tertiary)' }}>Cancel</button>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <p style={{ color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', marginBottom: '10px', fontSize: '0.85em' }}>
                                        {parseMarkdown(groupTutoringTutorContent) || 'No content yet'}
                                    </p>
                                    <button onClick={() => {
                                        setEditingPage('group_tutoring_tutor');
                                        setEditingPageType('group_tutoring_tutor');
                                    }}>Edit</button>
                                </div>
                            )}
                        </div>

                        <div>
                            <h4>Contact Page</h4>
                            {editingPage === 'contact' ? (
                                <div>
                                    <div style={{ marginBottom: '10px', display: 'flex', gap: '8px' }}>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setEditingPageType('contact');
                                                applyFormatting('bold');
                                            }}
                                            style={{
                                                padding: '6px 12px',
                                                fontWeight: 'bold',
                                                backgroundColor: 'var(--bg-tertiary)',
                                                color: 'var(--text-primary)',
                                                border: '1px solid var(--border-color)',
                                                borderRadius: '4px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <strong>B</strong>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setEditingPageType('contact');
                                                applyFormatting('italic');
                                            }}
                                            style={{
                                                padding: '6px 12px',
                                                fontStyle: 'italic',
                                                backgroundColor: 'var(--bg-tertiary)',
                                                color: 'var(--text-primary)',
                                                border: '1px solid var(--border-color)',
                                                borderRadius: '4px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            I
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setEditingPageType('contact');
                                                applyFormatting('underline');
                                            }}
                                            style={{
                                                padding: '6px 12px',
                                                textDecoration: 'underline',
                                                backgroundColor: 'var(--bg-tertiary)',
                                                color: 'var(--text-primary)',
                                                border: '1px solid var(--border-color)',
                                                borderRadius: '4px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            U
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setContactPageContent(contactPageContent + '{{tutoring_lead_email}}');
                                            }}
                                            style={{
                                                padding: '6px 12px',
                                                backgroundColor: 'var(--bg-tertiary)',
                                                color: 'var(--text-primary)',
                                                border: '1px solid var(--border-color)',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontSize: '0.85em'
                                            }}
                                        >
                                            📧 Insert Email
                                        </button>
                                    </div>
                                    <textarea
                                        value={contactPageContent}
                                        onChange={(e) => setContactPageContent(e.target.value)}
                                        onSelect={handleTextareaSelect}
                                        style={{
                                            width: '100%',
                                            minHeight: '200px',
                                            padding: '10px',
                                            backgroundColor: 'var(--bg-primary)',
                                            color: 'var(--text-primary)',
                                            border: '1px solid var(--border-color)',
                                            borderRadius: '6px',
                                            fontFamily: 'monospace'
                                        }}
                                    />
                                    <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
                                        <button onClick={() => handleSavePageContent('contact', contactPageContent)}>Save</button>
                                        <button onClick={() => setEditingPage(null)} style={{ backgroundColor: 'var(--bg-tertiary)' }}>Cancel</button>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <p style={{ color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', marginBottom: '10px' }}>
                                        {parseMarkdown(contactPageContent) || 'No content yet'}
                                    </p>
                                    <button onClick={() => {
                                        setEditingPage('contact');
                                        setEditingPageType('contact');
                                    }}>Edit</button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <hr />

            {/* Site Configuration */}
            <div>
                <h3 
                    onClick={() => toggleSection('siteConfig')}
                    style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
                >
                    {expandedSections.siteConfig ? '▼' : '▶'} Site Configuration
                </h3>
                {expandedSections.siteConfig && (
                    <div className="site-config-section">
                        <p>Update site-wide settings here</p>
                        
                        <form onSubmit={handleUpdateTutoringLeadEmail} className="site-config-form">
                            <div>
                                <label>Tutoring Lead Email</label>
                                <input
                                    type="email"
                                    value={newTutoringLeadEmail}
                                    onChange={(e) => setNewTutoringLeadEmail(e.target.value)}
                                />
                                <button type="submit">Update Email</button>
                            </div>
                        </form>

                        <form onSubmit={handleUpdateStudentPresidentEmail} className="site-config-form">
                            <div>
                                <label>Student President Email</label>
                                <input
                                    type="email"
                                    value={newStudentPresidentEmail}
                                    onChange={(e) => setNewStudentPresidentEmail(e.target.value)}
                                />
                                <button type="submit">Update Email</button>
                            </div>
                        </form>

                        <h3>Manage Math Subjects</h3>
                        <div className="manage-subjects-section">
                            <p>Edit the list of subjects available for students to select when registering</p>

                            <form onSubmit={handleAddSubject} className="add-subject-form">
                                <input
                                    type="text"
                                    placeholder="New subject (e.g., Calculus)"
                                    value={newSubject}
                                    onChange={(e) => setNewSubject(e.target.value)}
                                />
                                <button type="submit">Add Subject</button>
                            </form>

                            <div className="subjects-list">
                                {mathSubjects.map(subject => (
                                    <div key={subject} className="subject-tag">
                                        <span>{subject}</span>
                                        <button onClick={() => handleRemoveSubject(subject)}>
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <hr />
                    </div>
                )}
            </div>

            <hr />

            {/* Archived Sessions */}
            <div>
                <h3
                    onClick={() => toggleSection('archivedSessions')}
                    style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {expandedSections.archivedSessions ? '▼' : '▶'} Archived Info
                    </span>
                    <span style={{
                        backgroundColor: 'var(--accent-primary)',
                        color: 'white',
                        borderRadius: '50%',
                        width: '28px',
                        height: '28px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.85em',
                        fontWeight: 600
                    }}>
                        {archivedSessions.length}
                    </span>
                </h3>
                {expandedSections.archivedSessions && (
                    <div className="sessions-manage-list">
                        {archivedSessions.length === 0 ? (
                            <p style={{ color: 'var(--text-secondary)' }}>No archived sessions</p>
                        ) : (
                            archivedSessions.map(session => {
                                const learnerCount = session.group_tutoring_registrations?.filter(reg => reg.subject !== 'Tutor').length || 0;
                                const tutorCount = session.group_tutoring_registrations?.filter(reg => reg.subject === 'Tutor').length || 0;

                                return (
                                    <div key={session.id} style={{
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '8px',
                                        padding: '20px',
                                        marginBottom: '20px',
                                        backgroundColor: 'var(--bg-secondary)',
                                        opacity: 0.7
                                    }}>
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'start'
                                        }}>
                                            <div>
                                                <strong style={{ fontSize: '1.1em' }}>{session.session_time}</strong>
                                                <p style={{ margin: '5px 0 0 0', fontSize: '0.85em', color: 'var(--text-secondary)' }}>
                                                    {new Date(session.session_date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })} • {session.room_assignment}
                                                </p>
                                                <p style={{ margin: '5px 0 0 0', fontSize: '0.8em', color: 'var(--text-secondary)' }}>
                                                    👨‍🏫 {session.teacher_name}
                                                </p>
                                                <p style={{ margin: '5px 0 0 0', fontSize: '0.8em', color: 'var(--accent-primary)', fontWeight: 600 }}>
                                                    👥 {learnerCount} learners | 👨‍🏫 {tutorCount} tutors
                                                </p>
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px', alignSelf: 'flex-start' }}>
                                                <button
                                                    onClick={() => handleUnarchiveSession(session.id)}
                                                    className="edit-button"
                                                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.8em' }}
                                                >
                                                    Restore
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteGroupSession(session.id)}
                                                    className="delete-button"
                                                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.8em' }}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default AdminPanel;