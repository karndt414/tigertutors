import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_EMAIL,
        pass: process.env.GMAIL_PASSWORD
    }
});

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { tutorEmail } = req.body;

    try {
        const htmlContent = `
            <h2>✅ Tutor Account Approved!</h2>
            
            <p>Great news! Your tutor account has been approved on Tiger Tutors.</p>
            
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p>Your account is now active and ready to use. You can sign up with your email and password.</p>
            </div>

            <p>
                <a href="https://tigertutors.vercel.app" style="display: inline-block; padding: 10px 20px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px;">
                    Go to Tiger Tutors
                </a>
            </p>

            <p style="color: #666; font-size: 0.9em; margin-top: 20px;">
                If you have any questions, please contact the tutoring lead.
            </p>
        `;

        // Send email to tutor
        await transporter.sendMail({
            from: `Tiger Tutors <${process.env.GMAIL_EMAIL}>`,
            to: tutorEmail,
            subject: '✅ Your Tutor Account Has Been Approved!',
            html: htmlContent
        });

        console.log('Approval email sent successfully to:', tutorEmail);
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Email error:', error);
        res.status(500).json({ error: error.message });
    }
}