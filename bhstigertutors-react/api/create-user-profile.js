import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { userId, email, role } = req.body;

    if (!userId || !email || !role) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const { error } = await supabaseAdmin
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

        return res.status(200).json({ success: true });
    } catch (err) {
        console.error('Server error:', err);
        return res.status(500).json({ error: 'Server error' });
    }
}