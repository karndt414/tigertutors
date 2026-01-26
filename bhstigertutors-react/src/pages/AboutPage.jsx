import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

function AboutPage() {
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchContent();
    }, []);

    const fetchContent = async () => {
        try {
            const { data, error } = await supabase
                .from('page_content')
                .select('content')
                .eq('page_name', 'about')
                .single();

            if (data && data.content) {
                setContent(data.content);
            } else {
                setContent('Mu Alpha Theta is the National High School and Two-Year College Mathematics Honor Society. We are dedicated to inspiring keen interest in mathematics, developing strong scholarship in the subject, and promoting the enjoyment of mathematics in high school and two-year college students.\n\nThe BHS chapter upholds these values by offering free peer tutoring, participating in math competitions, and engaging in community service.');
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
        loadTutoringLeadEmail();
    }, []);

    const loadTutoringLeadEmail = async () => {
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
            .split(/(\*\*.*?\*\*|\*.*?\*|__.*?__|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g)
            .map((part, i) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={i}>{part.slice(2, -2)}</strong>;
                } else if (part.startsWith('__') && part.endsWith('__')) {
                    return <u key={i}>{part.slice(2, -2)}</u>;
                } else if (part.startsWith('*') && part.endsWith('*')) {
                    return <em key={i}>{part.slice(1, -1)}</em>;
                } else if (/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(part)) {
                    return <a key={i} href={`mailto:${part}`} style={{ color: 'var(--accent-primary)', textDecoration: 'underline', cursor: 'pointer' }}>{part}</a>;
                }
                return part;
            });
    };

    if (loading) return <p>Loading...</p>;

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
                <h2 style={{ margin: 0 }}>About Mu Alpha Theta</h2>
            </div>
            <p style={{ lineHeight: 1.7, fontSize: '1.1em', whiteSpace: 'pre-wrap' }}>
                {parseMarkdown(content)}
            </p>
        </div>
    );
}

export default AboutPage;