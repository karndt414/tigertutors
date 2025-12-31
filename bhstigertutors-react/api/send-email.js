import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_EMAIL,
        pass: process.env.GMAIL_PASSWORD
    }
});

export default async function handler(req, res) {
    console.log('API Key present:', !!process.env.RESEND_API_KEY);
    console.log('Request received:', req.method);
    console.log('Gmail email:', process.env.GMAIL_EMAIL);
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { email, sessionDetails } = req.body;
    console.log('Sending email to:', email);
    
    try {
        const info = await transporter.sendMail({
            from: `Tiger Tutors <${process.env.GMAIL_EMAIL}>`,
            to: email,
            subject: 'Session Registration Confirmed',
            html: `
                <h2>Registration Confirmed!</h2>
                <p>You've successfully registered for a group tutoring session.</p>
                <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Session Details:</strong></p>
                    <p>📅 Date: ${new Date(sessionDetails.sessionDate).toLocaleDateString()}</p>
                    <p>⏰ Time: ${sessionDetails.sessionTime}</p>
                    <p>📍 Room: ${sessionDetails.roomAssignment}</p>
                    <p>👨‍🏫 Teacher: ${sessionDetails.teacherName}</p>
                </div>
                <p>See you there!</p>
                <p>- Tiger Tutors Team</p>
            `
        });
        
        console.log('Email sent:', info.messageId);
        res.status(200).json({ success: true, messageId: info.messageId });
    } catch (error) {
        console.error('Email error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}