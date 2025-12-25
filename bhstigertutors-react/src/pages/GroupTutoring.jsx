import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

function GroupTutoring() {
    const [sessions, setSessions] = useState([]);

    useEffect(() => {
        fetchSessions();
    }, []);

    async function fetchSessions() {
        // We join with the 'tutors' table to get the name of the assigned tutor
        const { data, error } = await supabase
            .from('group_sessions')
            .select(`
        *,
        tutors ( name )
      `)
            .order('session_date', { ascending: true });

        if (error) console.error(error);
        else setSessions(data);
    }

    return (
        <div className="group-tutoring">
            <h2>Upcoming Group Sessions</h2>
            <div className="session-grid">
                {sessions.map(session => (
                    <div key={session.id} className="session-card">
                        <h3>{session.subject}</h3>
                        <p><strong>Tutor:</strong> {session.tutors?.name}</p>
                        <p><strong>When:</strong> {new Date(session.session_date).toLocaleString()}</p>
                        <p><strong>Spots:</strong> {session.current_count} / {session.max_capacity}</p>

                        {session.current_count >= session.max_capacity ? (
                            <button className="book-button disabled" disabled>Session Full</button>
                        ) : (
                            <a href={session.zoom_link} className="book-button">Join Session</a>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default GroupTutoring;