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

    const { tutorEmail, timestamp } = req.body;

    try {
        console.log('Fetching tutoring lead and student president emails...');
        
        // Fetch tutoring lead and student president emails
        const { data: tutoringLeadData } = await supabase
            .from('site_config')
            .select('value')
            .eq('key', 'tutoring_lead_email')
            .single();

        const { data: presidentData } = await supabase
            .from('site_config')
            .select('value')
            .eq('key', 'student_president_email')
            .single();

        const emails = [];
        if (tutoringLeadData?.value) emails.push(tutoringLeadData.value);
        if (presidentData?.value) emails.push(presidentData.value);

        if (emails.length === 0) {
            console.error('No recipient emails found');
            return res.status(500).json({ error: 'Could not find recipient emails' });
        }

        console.log('Sending approval request to:', emails);

        // Add to pending requests list
        const { data: existingRequests } = await supabase
            .from('site_config')
            .select('value')
            .eq('key', 'pending_tutor_requests')
            .single();

        let requests = [];
        if (existingRequests?.value) {
            requests = JSON.parse(existingRequests.value);
        }

        // Check if already pending
        if (!requests.find(r => r.email === tutorEmail)) {
            requests.push({
                email: tutorEmail,
                timestamp: timestamp
            });

            await supabase
                .from('site_config')
                .upsert({
                    key: 'pending_tutor_requests',
                    value: JSON.stringify(requests),
                    updated_at: new Date().toISOString()
                }, { onConflict: 'key' });
        }

        const htmlContent = `
            <h2>⏳ New Tutor Approval Request</h2>
            
            <p>A new tutor is waiting for approval on Tiger Tutors!</p>
            
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Tutor Email:</strong> ${tutorEmail}</p>
                <p><strong>Requested:</strong> ${new Date(timestamp).toLocaleString('en-US', { timeZone: 'America/Chicago' })}</p>
            </div>

            <p>
                <a href="https://tigertutors.vercel.app/#/admin" style="display: inline-block; padding: 10px 20px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px;">
                    Review in Admin Panel
                </a>
            </p>

            <p style="color: #666; font-size: 0.9em; margin-top: 20px;">
                You can approve or deny this request in the Admin Panel under "Pending Tutor Approvals".
            </p>
        `;

        // Send email to tutoring lead and student president
        await transporter.sendMail({
            from: `Tiger Tutors <${process.env.GMAIL_EMAIL}>`,
            to: emails.join(','),
            subject: `[Tutor Approval] ${tutorEmail}`,
            html: htmlContent
        });

        console.log('Approval request email sent successfully');
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Email error:', error);
        res.status(500).json({ error: error.message });
    }
}