import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_EMAIL,
        pass: process.env.GMAIL_PASSWORD
    }
});

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { tutorName, tutorEmail, subject, experience } = req.body;

    try {
        console.log('Fetching admin emails...');
        
        // Fetch all admin emails from users table
        const { data: admins, error: adminError } = await supabase
            .from('users')
            .select('email')
            .eq('role', 'admin');

        console.log('Admins result:', { admins, adminError });

        if (adminError || !admins || admins.length === 0) {
            console.error('No admins found or error:', adminError);
            return res.status(500).json({ error: 'Could not fetch admin emails' });
        }

        const adminEmails = admins.map(admin => admin.email);
        console.log('Admin emails to send to:', adminEmails);

        const htmlContent = `
            <h2>🎓 New Tutor Registration</h2>
            
            <p>A new tutor has registered on Tiger Tutors!</p>
            
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Tutor Information:</strong></p>
                <p><strong>Name:</strong> ${tutorName}</p>
                <p><strong>Email:</strong> ${tutorEmail}</p>
                <p><strong>Subject:</strong> ${subject}</p>
                <p><strong>Experience:</strong> ${experience}</p>
            </div>

            <p>
                <a href="https://your-site.vercel.app/admin" style="display: inline-block; padding: 10px 20px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px;">
                    Review in Admin Panel
                </a>
            </p>

            <p style="color: #666; font-size: 0.9em; margin-top: 20px;">
                Reply to: <a href="mailto:${tutorEmail}">${tutorEmail}</a>
            </p>
        `;

        // Send email to all admins
        await transporter.sendMail({
            from: `Tiger Tutors <${process.env.GMAIL_EMAIL}>`,
            to: adminEmails.join(','),
            subject: `[New Tutor] ${tutorName} - ${subject}`,
            html: htmlContent
        });

        console.log('Email sent successfully');
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Email error:', error);
        res.status(500).json({ error: error.message });
    }
}