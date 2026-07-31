import { supabaseAdmin, isSupabaseConfigured } from '../../../../lib/supabaseAdmin';
import { logMessage } from '../../../../lib/messageLog';
import { renderEmail } from '../../../../lib/emailTemplate';

export async function POST(request) {
  if (!isSupabaseConfigured) {
    return Response.json({ error: 'The site is not fully set up yet.' }, { status: 503 });
  }

  try {
    const { visitor_name, visitor_email, visitor_phone, message } = await request.json();

    if (!visitor_name?.trim() || !visitor_email?.trim() || !message?.trim()) {
      return Response.json({ error: 'Name, email, and a message are required.' }, { status: 400 });
    }

    const { data: thread, error: threadError } = await supabaseAdmin
      .from('chat_threads')
      .insert({
        visitor_name: visitor_name.trim(),
        visitor_email: visitor_email.trim().toLowerCase(),
        visitor_phone: visitor_phone?.trim() || null,
      })
      .select()
      .single();

    if (threadError || !thread) {
      console.error('Chat thread creation failed:', threadError?.message);
      return Response.json({ error: 'Could not start the chat. Please try again.' }, { status: 500 });
    }

    const { error: msgError } = await supabaseAdmin.from('chat_messages').insert({
      thread_id: thread.id,
      sender: 'visitor',
      message: message.trim(),
    });

    if (msgError) {
      console.error('First chat message insert failed:', msgError.message);
    }

    // Instant alert to the admin — this is the whole point of the widget
    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
    if (adminEmail) {
      const subject = `New chat started by ${visitor_name}`;
      const html = renderEmail({
        eyebrow: 'Live Chat',
        heading: `${visitor_name} just started a chat.`,
        bodyHtml: `
          <p style="margin:0 0 16px;"><strong>${visitor_name}</strong> (${visitor_email}${visitor_phone ? `, ${visitor_phone}` : ''}) sent:</p>
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
        console.error('Admin chat-start alert failed:', err);
        await logMessage({ messageType: 'chat_alert', recipientEmail: adminEmail, subject, status: 'failed' });
      }
    }

    return Response.json({ success: true, thread_id: thread.id });
  } catch (err) {
    console.error('Chat start route error:', err);
    return Response.json({ error: 'Unexpected error. Please try again.' }, { status: 500 });
  }
}
