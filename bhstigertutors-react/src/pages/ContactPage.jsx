import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { getTutoringLeadEmail } from '../configUtils';
import '../App.css';

function ContactPage() {
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [contactEmail, setContactEmail] = useState('wolfkame@bentonvillek12.org');
    const subject = "BHS Tutoring Inquiry";
    const mailtoLink = `mailto:${contactEmail}?subject=${encodeURIComponent(subject)}`;

    const [formType, setFormType] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        userType: 'learner',
        subject: '',
        message: ''
    });
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        fetchContent();
        loadTutoringLeadEmail();
    }, []);

    const loadTutoringLeadEmail = async () => {
        const email = await getTutoringLeadEmail();
        setContactEmail(email);
    };

    const fetchContent = async () => {
        try {
            const { data } = await supabase
                .from('page_content')
                .select('content')
                .eq('page_name', 'contact')
                .single();

            if (data && data.content) {
                setContent(data.content);
            } else {
                setContent('Have questions about tutoring? Want to learn more about joining Mu Alpha Theta?\n\nThe best way to get in touch is to email the faculty sponsor or student officers directly.\nClick the button below to start an email, or use one of the forms below.');
            }
        } catch (err) {
            console.error('Error fetching content:', err);
        } finally {
            setLoading(false);
        }
    };

    const [tutoringLeadEmail, setTutoringLeadEmail] = useState('wolfkame@bentonvillek12.org');

    useEffect(() => {
        fetchContent();
        loadingTutoringLeadEmail();
    }, []);

    const loadingTutoringLeadEmail = async () => {
        const { data } = await supabase
            .from('site_config')
            .select('value')
            .eq('key', 'tutoring_lead_email')
            .single();

        if (data) {
            setTutoringLeadEmail(data.value);
        }
    };

    const parseMarkdown = (text) => {
        if (!text) return text;

        // Replace email placeholder with actual email
        let processedText = text.replace('{{tutoring_lead_email}}', tutoringLeadEmail);

        return processedText
            .split(/(\*\*.*?\*\*|\*.*?\*|__.*?__)/g)
            .map((part, i) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={i}>{part.slice(2, -2)}</strong>;
                } else if (part.startsWith('__') && part.endsWith('__')) {
                    return <u key={i}>{part.slice(2, -2)}</u>;
                } else if (part.startsWith('*') && part.endsWith('*')) {
                    return <em key={i}>{part.slice(1, -1)}</em>;
                }
                return part;
            });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch('/api/send-admin-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: formType,
                    ...formData
                })
            });

            if (response.ok) {
                setSubmitted(true);
                setFormData({
                    name: '',
                    email: '',
                    userType: 'learner',
                    subject: '',
                    message: ''
                });
                setFormType(null);

                setTimeout(() => setSubmitted(false), 5000);
            } else {
                alert('Error submitting form. Please try again.');
            }
        } catch (err) {
            console.error('Form submission error:', err);
            alert('Error submitting form. Please try again.');
        }
    };

    if (loading) return <p>Loading...</p>;

    return (
        <div>
            <h2>Contact Us</h2>
            <p style={{ lineHeight: 1.7, fontSize: '1.1em', whiteSpace: 'pre-wrap' }}>
                {parseMarkdown(content)}
            </p>

            <a
                href={mailtoLink}
                className="book-button"
                style={{ marginTop: '20px', textDecoration: 'none' }}
            >
                Email the Tutoring Lead
            </a>

            {/* Form Selection */}
            {!formType ? (
                <div style={{ marginTop: '3rem' }}>
                    <h3>Or submit a form:</h3>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1.5rem' }}>
                        <button
                            onClick={() => setFormType('question')}
                            style={{
                                padding: '1rem 2rem',
                                backgroundColor: 'var(--accent-primary)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '1em',
                                fontWeight: 500,
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--accent-primary-hover)'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--accent-primary)'}
                        >
                            📝 Ask a Question
                        </button>
                        <button
                            onClick={() => setFormType('complaint')}
                            style={{
                                padding: '1rem 2rem',
                                backgroundColor: 'var(--accent-danger)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '1em',
                                fontWeight: 500,
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--accent-danger-hover)'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--accent-danger)'}
                        >
                            ⚠️ Report an Issue
                        </button>
                    </div>
                </div>
            ) : (
                /* Form */
                <div style={{
                    marginTop: '3rem',
                    maxWidth: '600px',
                    backgroundColor: 'var(--bg-secondary)',
                    padding: '2rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)'
                }}>
                    <h3>{formType === 'question' ? 'Ask a Question' : 'Report an Issue'}</h3>

                    {submitted && (
                        <div style={{
                            backgroundColor: 'rgba(34, 197, 94, 0.1)',
                            color: '#22c55e',
                            padding: '1rem',
                            borderRadius: '6px',
                            marginBottom: '1rem'
                        }}>
                            ✓ Thank you! Your {formType} has been sent to the admin team.
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                                Name *
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                required
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '6px',
                                    backgroundColor: 'var(--bg-primary)',
                                    color: 'var(--text-primary)',
                                    fontSize: '1em',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                                Email *
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                required
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '6px',
                                    backgroundColor: 'var(--bg-primary)',
                                    color: 'var(--text-primary)',
                                    fontSize: '1em',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                                I am a *
                            </label>
                            <select
                                name="userType"
                                value={formData.userType}
                                onChange={handleInputChange}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '6px',
                                    backgroundColor: 'var(--bg-primary)',
                                    color: 'var(--text-primary)',
                                    fontSize: '1em',
                                    boxSizing: 'border-box'
                                }}
                            >
                                <option value="learner">Student/Learner</option>
                                <option value="tutor">Tutor</option>
                            </select>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                                Subject *
                            </label>
                            <input
                                type="text"
                                name="subject"
                                value={formData.subject}
                                onChange={handleInputChange}
                                placeholder={formType === 'question' ? 'What would you like to know?' : 'What is the issue?'}
                                required
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '6px',
                                    backgroundColor: 'var(--bg-primary)',
                                    color: 'var(--text-primary)',
                                    fontSize: '1em',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                                Message *
                            </label>
                            <textarea
                                name="message"
                                value={formData.message}
                                onChange={handleInputChange}
                                placeholder="Tell us more..."
                                required
                                rows="5"
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '6px',
                                    backgroundColor: 'var(--bg-primary)',
                                    color: 'var(--text-primary)',
                                    fontSize: '1em',
                                    fontFamily: 'var(--font-body)',
                                    boxSizing: 'border-box',
                                    resize: 'vertical'
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button
                                type="submit"
                                style={{
                                    padding: '0.75rem 2rem',
                                    backgroundColor: 'var(--accent-primary)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '1em',
                                    fontWeight: 500
                                }}
                            >
                                Send
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormType(null)}
                                style={{
                                    padding: '0.75rem 2rem',
                                    backgroundColor: 'var(--bg-tertiary)',
                                    color: 'var(--text-primary)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '1em',
                                    fontWeight: 500
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <ul style={{ lineHeight: 1.7, fontSize: '1.1em', margin: '40px 0 0 20px' }}>
                <li><strong>Tutoring Lead:</strong> Megan Wolfka</li>
                <li><strong>Student President:</strong> Koree Arndt</li>
            </ul>
        </div>
    );
}

export default ContactPage;