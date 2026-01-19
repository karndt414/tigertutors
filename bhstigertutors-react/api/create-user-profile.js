import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { userId, email, role } = req.body;

    console.log('Creating user profile:', { userId, email, role });

    if (!userId || !email || !role) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const { error, data } = await supabaseAdmin
            .from('users')
            .insert({
                id: userId,
                email,
                role,
                created_at: new Date().toISOString(),
            });

        if (error) {
            console.error('Supabase insert error:', error);
            return res.status(400).json({ error: error.message });
        }

        console.log('User profile created:', data);
        return res.status(200).json({ success: true, data });
    } catch (err) {
        console.error('Server error:', err);
        return res.status(500).json({ error: err.message });
    }
}