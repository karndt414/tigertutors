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
    try {
        console.log('Checking for sessions 24 hours away...');

        // Get all sessions happening in exactly 24 hours (with some buffer)
        const now = new Date();
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const tomorrowEnd = new Date(tomorrow.getTime() + 60 * 60 * 1000);

        const { data: sessionsToRemind, error: sessionError } = await supabase
            .from('group_tutoring_sessions')
            .select('id, session_date, session_time, room_assignment, teacher_name')
            .gte('session_date', tomorrow.toISOString().split('T')[0])
            .lt('session_date', tomorrowEnd.toISOString().split('T')[0]);

        console.log('Sessions to remind:', { sessionsToRemind, sessionError });

        if (sessionError || !sessionsToRemind || sessionsToRemind.length === 0) {
            return res.status(200).json({ success: true, sentCount: 0 });
        }

        let sentCount = 0;

        // For each session, get all registered learners
        for (const session of sessionsToRemind) {
            const { data: registrations, error: regError } = await supabase
                .from('group_tutoring_registrations')
                .select('school_email, full_name, subject, session_id')
                .eq('session_id', session.id);

            if (regError || !registrations) {
                console.error('Error fetching registrations:', regError);
                continue;
            }

            // Send reminder to each registered learner
            for (const registration of registrations) {
                const htmlContent = `
                    <h2>📅 Session Reminder</h2>
                    
                    <p>Hi ${registration.full_name},</p>
                    
                    <p>This is a reminder that your group tutoring session is <strong>tomorrow!</strong></p>
                    
                    <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p><strong>Session Details:</strong></p>
                        <p>📅 Date: ${new Date(session.session_date).toLocaleDateString()}</p>
                        <p>⏰ Time: ${session.session_time}</p>
                        <p>📍 Room: ${session.room_assignment}</p>
                        <p>👨‍🏫 Teacher: ${session.teacher_name}</p>
                        <p>📚 Subject: ${registration.subject}</p>
                    </div>

                    <p><strong>Don't forget to:</strong></p>
                    <ul>
                        <li>Bring your math materials (notes, homework, etc.)</li>
                        <li>Check that you're registered in RTI</li>
                        <li>Arrive on time</li>
                    </ul>

                    <p>See you tomorrow!</p>
                    <p>- Tiger Tutors Team</p>
                `;

                try {
                    await transporter.sendMail({
                        from: `Tiger Tutors <${process.env.GMAIL_EMAIL}>`,
                        to: registration.school_email,
                        subject: `📅 Reminder: Group Tutoring Session Tomorrow`,
                        html: htmlContent
                    });

                    sentCount++;
                    console.log(`Reminder sent to ${registration.school_email}`);
                } catch (emailError) {
                    console.error(`Failed to send to ${registration.school_email}:`, emailError);
                }
            }
        }

        res.status(200).json({ success: true, sentCount });
    } catch (error) {
        console.error('Reminder service error:', error);
        res.status(500).json({ error: error.message });
    }
}