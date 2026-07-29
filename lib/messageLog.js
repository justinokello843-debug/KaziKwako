import { supabaseAdmin } from './supabaseAdmin';

/**
 * Records one entry in message_log for every automated email attempt —
 * called after each individual send, whether it succeeded or failed.
 * Never throws: a logging failure should never break the actual email flow.
 */
export async function logMessage({ messageType, recipientEmail, subject, relatedJobId = null, status = 'sent' }) {
  try {
    await supabaseAdmin.from('message_log').insert({
      message_type: messageType,
      recipient_email: recipientEmail,
      subject: subject || null,
      related_job_id: relatedJobId,
      status,
    });
  } catch (err) {
    console.error('message_log insert failed (non-fatal):', err);
  }
}
