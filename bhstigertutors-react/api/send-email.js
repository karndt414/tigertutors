import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
    console.log('API Key present:', !!process.env.RESEND_API_KEY);
    console.log('Request received:', req.method);
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { email, sessionDetails } = req.body;
    console.log('Sending email to:', email);
    
    try {
        const result = await resend.emails.send({
            from: 'Tiger Tutors <onboarding@resend.dev>',  // Change this line
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
        
        console.log('Email sent successfully:', result);
        res.status(200).json({ success: true, result });
    } catch (error) {
        console.error('Email error:', error);
        res.status(500).json({ error: error.message });
    }
}