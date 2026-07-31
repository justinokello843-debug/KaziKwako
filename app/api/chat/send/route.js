import { supabaseAdmin, isSupabaseConfigured } from '../../../../lib/supabaseAdmin';
import { logMessage } from '../../../../lib/messageLog';
import { renderEmail } from '../../../../lib/emailTemplate';

export async function POST(request) {
  if (!isSupabaseConfigured) {
    return Response.json({ error: 'The site is not fully set up yet.' }, { status: 503 });
  }

  try {
    const { thread_id, message } = await request.json();
    if (!thread_id || !message?.trim()) {
      return Response.json({ error: 'thread_id and message are required.' }, { status: 400 });
    }

    const { data: thread, error: threadError } = await supabaseAdmin
      .from('chat_threads')
      .select('id, visitor_name, visitor_email')
      .eq('id', thread_id)
      .single();

    if (threadError || !thread) {
      return Response.json({ error: 'Chat not found.' }, { status: 404 });
    }

    const { error: msgError } = await supabaseAdmin.from('chat_messages').insert({
      thread_id,
      sender: 'visitor',
      message: message.trim(),
    });

    if (msgError) {
      console.error('Chat message insert failed:', msgError.message);
      return Response.json({ error: 'Could not send your message.' }, { status: 500 });
    }

    await supabaseAdmin.from('chat_threads').update({ last_message_at: new Date().toISOString(), status: 'open' }).eq('id', thread_id);

    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
    if (adminEmail) {
      const subject = `New message from ${thread.visitor_name} in an ongoing chat`;
      const html = renderEmail({
        eyebrow: 'Live Chat',
        heading: `${thread.visitor_name} replied.`,
        bodyHtml: `
          <div style="background:#F7F3E9;border-left:3px solid #E8A33D;border-radius:6px;padding:16px 20px;margin:0 0 22px;font-style:italic;">
            "${message.trim()}"
          </div>
          <p style="margin:0 0 24px;">Reply from your admin inbox to answer them directly.</p>
        `,
      });
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ from: process.env.ALERTS_FROM_EMAIL, to: adminEmail, subject, html }),
        });
        await logMessage({ messageType: 'chat_alert', recipientEmail: adminEmail, subject, status: res.ok ? 'sent' : 'failed' });
      } catch (err) {
        console.error('Admin chat alert failed:', err);
      }
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error('Chat send route error:', err);
    return Response.json({ error: 'Unexpected error. Please try again.' }, { status: 500 });
  }
}
