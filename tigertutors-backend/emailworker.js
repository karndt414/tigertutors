const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// This function runs every 30 seconds to check for unsent emails
async function processEmailQueue() {
  console.log('Checking for emails to send...');

  // Get pending emails from queue
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

  // Send each email using Supabase's email function
  for (const email of emails) {
    try {
      const { error: sendError } = await supabase.functions.invoke('send-email', {
        body: {
          to: email.to_email,
          subject: email.subject,
          html: email.body,
        },
      });

      if (sendError) {
        throw sendError;
      }

      // Mark as sent
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

// Run every 30 seconds
setInterval(processEmailQueue, 30000);
processEmailQueue();

console.log('Email worker started. Processing emails every 30 seconds...');