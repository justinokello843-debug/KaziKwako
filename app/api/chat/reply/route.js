import { supabaseAdmin, isSupabaseConfigured } from '../../../../lib/supabaseAdmin';
import { logMessage } from '../../../../lib/messageLog';
import { renderEmail, whatsappButton } from '../../../../lib/emailTemplate';

export async function POST(request) {
  if (!isSupabaseConfigured) {
    return Response.json({ error: 'The site is not fully set up yet.' }, { status: 503 });
  }

  try {
    const { passcode, thread_id, message } = await request.json();
    if (passcode !== process.env.ADMIN_PASSCODE) {
      return Response.json({ error: 'Wrong passcode.' }, { status: 401 });
    }
    if (!thread_id || !message?.trim()) {
      return Response.json({ error: 'thread_id and message are required.' }, { status: 400 });
    }

    const { data: thread, error: threadError } = await supabaseAdmin
      .from('chat_threads')
      .select('id, visitor_name, visitor_email')
      .eq('id', thread_id)
      .single();

    if (threadError || !thread) {
      return Response.json({ error: 'Conversation not found.' }, { status: 404 });
    }

    const { error: msgError } = await supabaseAdmin.from('chat_messages').insert({
      thread_id,
      sender: 'admin',
      message: message.trim(),
    });

    if (msgError) {
      console.error('Admin reply insert failed:', msgError.message);
      return Response.json({ error: 'Could not save your reply.' }, { status: 500 });
    }

    await supabaseAdmin.from('chat_threads').update({ last_message_at: new Date().toISOString() }).eq('id', thread_id);

    // Instant email to the client — this is what makes it feel like a real, responsive team
    const firstName = thread.visitor_name.split(' ')[0];
    const subject = `New reply from Kazi support`;
    const html = renderEmail({
      eyebrow: 'Live Chat',
      heading: `You've got a reply, ${firstName}.`,
      bodyHtml: `
        <div style="background:#F7F3E9;border-left:3px solid #E8A33D;border-radius:6px;padding:16px 20px;margin:0 0 22px;">
          ${message.trim().replace(/\n/g, '<br/>')}
        </div>
        <p style="margin:0 0 24px;">Head back to the chat on our site to continue the conversation, or reach us directly on WhatsApp:</p>
      `,
      ctaHtml: whatsappButton(`Hi, following up on our chat — ${message.trim().slice(0, 80)}`),
    });

    let emailed = true;
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: process.env.ALERTS_FROM_EMAIL, to: thread.visitor_email, subject, html }),
      });
      emailed = res.ok;
      await logMessage({ messageType: 'chat_reply', recipientEmail: thread.visitor_email, subject, status: res.ok ? 'sent' : 'failed' });
    } catch (err) {
      console.error('Client reply email failed:', err);
      emailed = false;
      await logMessage({ messageType: 'chat_reply', recipientEmail: thread.visitor_email, subject, status: 'failed' });
    }

    return Response.json({ success: true, emailed });
  } catch (err) {
    console.error('Chat reply route error:', err);
    return Response.json({ error: 'Unexpected error.' }, { status: 500 });
  }
}
