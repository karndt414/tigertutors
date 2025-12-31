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

    const { type, name, email, userType, subject, message } = req.body;

    try {
        console.log('Fetching admin emails from users table...');
        
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

        const emailType = type === 'question' ? '📝 Question' : '⚠️ Complaint';
        const htmlContent = `
            <h2>${emailType} from ${userType === 'learner' ? 'Student' : 'Tutor'}</h2>
            
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>From:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Type:</strong> ${userType === 'learner' ? 'Student/Learner' : 'Tutor'}</p>
                <p><strong>Subject:</strong> ${subject}</p>
                <hr style="margin: 20px 0;">
                <p><strong>Message:</strong></p>
                <p>${message.replace(/\n/g, '<br>')}</p>
            </div>

            <p style="color: #666; font-size: 0.9em; margin-top: 20px;">
                Reply to: <a href="mailto:${email}">${email}</a>
            </p>
        `;

        // Send email to all admins
        await transporter.sendMail({
            from: `Tiger Tutors <${process.env.GMAIL_EMAIL}>`,
            to: adminEmails.join(','),
            subject: `[${emailType}] ${subject}`,
            html: htmlContent
        });

        console.log('Email sent successfully');
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Email error:', error);
        res.status(500).json({ error: error.message });
    }
}