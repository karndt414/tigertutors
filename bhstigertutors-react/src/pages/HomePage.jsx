import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

function HomePage() {
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
                .eq('page_name', 'home')
                .single();

            if (data && data.content) {
                setContent(data.content);
            } else {
                // Fallback content if nothing in database
                setContent('Welcome to BHS Tiger Tutors! We are the Bentonville High School chapter of Mu Alpha Theta, the National Mathematics Honor Society. Our mission is to provide high-quality, free peer tutoring to BHS students across a variety of subjects.\n\nUse this site to find a qualified tutor for your class, learn more about our chapter, or get in touch with our officers.');
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
            <h2>Welcome to BHS Tiger Tutors!</h2>
            <p style={{ lineHeight: 1.7, fontSize: '1.1em', whiteSpace: 'pre-wrap' }}>
                {parseMarkdown(content)}
            </p>
        </div>
    );
}

export default HomePage;