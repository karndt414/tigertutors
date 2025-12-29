const nodemailer = require('nodemailer');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Connect to your Supabase project
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Set up Gmail to send emails
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// This function runs every 30 seconds to check for unsent emails
async function processEmailQueue() {
  console.log('Checking for emails to send...');

  // Get all pending emails from Supabase
  const { data: emails, error } = await supabase
    .from('email_queue')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(10);

  if (error) {
    console.error('Error fetching emails:', error);
    return;
  }

  if (!emails || emails.length === 0) {
    console.log('No pending emails');
    return;
  }

  // Send each email one by one
  for (const email of emails) {
    try {
      await transporter.sendMail({
        from: process.env.GMAIL_USER,
        to: email.to_email,
        subject: email.subject,
        html: email.body,
      });

      // Mark as sent in Supabase
      await supabase
        .from('email_queue')
        .update({
          status: 'sent',
          sent_at: new Date(),
        })
        .eq('id', email.id);

      console.log(`✅ Email sent to ${email.to_email}`);
    } catch (err) {
      console.error(`❌ Failed to send email to ${email.to_email}:`, err);

      // Mark as failed
      await supabase
        .from('email_queue')
        .update({ status: 'failed' })
        .eq('id', email.id);
    }
  }
}

// Run every 30 seconds forever
setInterval(processEmailQueue, 30000);

// Run once immediately
processEmailQueue();

console.log('Email worker started. Processing emails every 30 seconds...');