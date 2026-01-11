import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { tutorEmail, role } = req.body;

    try {
        // Check if user already exists
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', tutorEmail.toLowerCase())
            .single();

        if (existingUser) {
            console.log('User already exists:', tutorEmail);
            return res.status(200).json({ success: true, message: 'User already exists' });
        }

        // Create user in users table with a temporary ID
        const { data: newUser, error: userError } = await supabase
            .from('users')
            .insert({
                email: tutorEmail.toLowerCase(),
                role: role || 'tutor',
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (userError) {
            console.error('Error creating user:', userError);
            return res.status(500).json({ error: 'Failed to create user: ' + userError.message });
        }

        console.log('User created successfully:', tutorEmail);
        res.status(200).json({ success: true, user: newUser });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
}