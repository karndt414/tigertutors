import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import './GroupTutoring.css';

function GroupTutoring() {
    const [sessions, setSessions] = useState([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedSession, setSelectedSession] = useState(null);

    useEffect(() => {
        fetchSessions();
    }, []);

    async function fetchSessions() {
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

    // Get days in month
    const getDaysInMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    // Get first day of month (0 = Sunday)
    const getFirstDayOfMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    // Check if a date has sessions
    const getSessionsForDate = (day) => {
        return sessions.filter(session => {
            const sessionDate = new Date(session.session_date);
            return (
                sessionDate.getDate() === day &&
                sessionDate.getMonth() === currentDate.getMonth() &&
                sessionDate.getFullYear() === currentDate.getFullYear()
            );
        });
    };

    // Navigate months
    const goToPreviousMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
    };

    const goToNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
    };

    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

    // Create array of days (with nulls for empty cells)
    const calendarDays = [];
    for (let i = 0; i < firstDay; i++) {
        calendarDays.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
        calendarDays.push(i);
    }

    return (
        <div className="group-tutoring">
            <h2>Group Tutoring Calendar</h2>

            <div className="calendar-container">
                {/* Calendar Header */}
                <div className="calendar-header">
                    <button onClick={goToPreviousMonth} className="nav-button">← Previous</button>
                    <h3>{monthName}</h3>
                    <button onClick={goToNextMonth} className="nav-button">Next →</button>
                </div>

                {/* Day of week labels */}
                <div className="calendar-grid">
                    <div className="day-label">Sun</div>
                    <div className="day-label">Mon</div>
                    <div className="day-label">Tue</div>
                    <div className="day-label">Wed</div>
                    <div className="day-label">Thu</div>
                    <div className="day-label">Fri</div>
                    <div className="day-label">Sat</div>

                    {/* Calendar days */}
                    {calendarDays.map((day, index) => {
                        const daySessions = day ? getSessionsForDate(day) : [];
                        const hasSession = daySessions.length > 0;

                        return (
                            <div
                                key={index}
                                className={`calendar-day ${!day ? 'empty' : ''} ${hasSession ? 'has-session' : ''}`}
                                onClick={() => day && hasSession && setSelectedSession({ day, sessions: daySessions })}
                            >
                                <div className="day-number">{day}</div>
                                {hasSession && (
                                    <div className="session-indicator">
                                        <div className="dot"></div>
                                        <span className="session-count">{daySessions.length}</span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Session details modal */}
            {selectedSession && (
                <div className="session-modal-backdrop" onClick={() => setSelectedSession(null)}>
                    <div className="session-modal" onClick={(e) => e.stopPropagation()}>
                        <button className="close-button" onClick={() => setSelectedSession(null)}>×</button>
                        <h3>Sessions on {selectedSession.day}</h3>
                        <div className="session-list">
                            {selectedSession.sessions.map(session => (
                                <div key={session.id} className="session-detail">
                                    <h4>{session.subject}</h4>
                                    <p><strong>Tutor:</strong> {session.tutors?.name}</p>
                                    <p><strong>Time:</strong> {new Date(session.session_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                    <p><strong>Spots:</strong> {session.current_count} / {session.max_capacity}</p>
                                    {session.current_count >= session.max_capacity ? (
                                        <button className="book-button disabled" disabled>Session Full</button>
                                    ) : (
                                        <a href={session.zoom_link} target="_blank" rel="noopener noreferrer" className="book-button">Join Session</a>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Upcoming sessions list (optional) */}
            <h3 style={{ marginTop: '40px' }}>Upcoming Sessions</h3>
            <div className="session-grid">
                {sessions.slice(0, 6).map(session => (
                    <div key={session.id} className="session-card">
                        <h4>{session.subject}</h4>
                        <p><strong>Tutor:</strong> {session.tutors?.name}</p>
                        <p><strong>When:</strong> {new Date(session.session_date).toLocaleString()}</p>
                        <p><strong>Spots:</strong> {session.current_count} / {session.max_capacity}</p>
                        {session.current_count >= session.max_capacity ? (
                            <button className="book-button disabled" disabled>Session Full</button>
                        ) : (
                            <a href={session.zoom_link} target="_blank" rel="noopener noreferrer" className="book-button">Join Session</a>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default GroupTutoring;