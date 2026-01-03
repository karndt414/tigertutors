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
                // Fallback content if nothing in database
                setContent('Mu Alpha Theta is the National High School and Two-Year College Mathematics Honor Society. We are dedicated to inspiring keen interest in mathematics, developing strong scholarship in the subject, and promoting the enjoyment of mathematics in high school and two-year college students.\n\nThe BHS chapter upholds these values by offering free peer tutoring, participating in math competitions, and engaging in community service.');
            }
        } catch (err) {
            console.error('Error fetching content:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <p>Loading...</p>;

    return (
        <div>
            <h2>About Mu Alpha Theta</h2>
            <p style={{ lineHeight: 1.7, fontSize: '1.1em', whiteSpace: 'pre-wrap' }}>
                {content}
            </p>
        </div>
    );
}

export default AboutPage;