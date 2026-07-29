import { supabaseAdmin, isSupabaseConfigured } from '../../../lib/supabaseAdmin';
import { logMessage } from '../../../lib/messageLog';
import { renderEmail, whatsappButton } from '../../../lib/emailTemplate';

export async function POST(request) {
  if (!isSupabaseConfigured) {
    return Response.json({ error: 'The site is not fully set up yet.' }, { status: 503 });
  }

  try {
    const { passcode, job_id, subscriber_ids } = await request.json();

    if (passcode !== process.env.ADMIN_PASSCODE) {
      return Response.json({ error: 'Wrong passcode.' }, { status: 401 });
    }
    if (!job_id || !Array.isArray(subscriber_ids) || subscriber_ids.length === 0) {
      return Response.json({ error: 'job_id and at least one subscriber_id are required.' }, { status: 400 });
    }

    const { data: job, error: jobError } = await supabaseAdmin
      .from('jobs')
      .select('id, title, company')
      .eq('id', job_id)
      .single();

    if (jobError || !job) {
      return Response.json({ error: 'Job not found.' }, { status: 404 });
    }

    const { data: people, error: peopleError } = await supabaseAdmin
      .from('subscribers')
      .select('id, full_name, email')
      .in('id', subscriber_ids);

    if (peopleError || !people || people.length === 0) {
      return Response.json({ error: 'Could not find the selected candidates.' }, { status: 404 });
    }

    const subject = `You've been shortlisted for ${job.title} at ${job.company}`;
    let sent = 0;
    const failures = [];

    for (const person of people) {
      const firstName = person.full_name ? person.full_name.split(' ')[0] : 'there';
      const shortlistHtml = renderEmail({
        eyebrow: 'Shortlist Confirmed',
        heading: `Congratulations, ${firstName} — you've been shortlisted.`,
        bodyHtml: `
          <p style="margin:0 0 16px;">After reviewing candidates for the role you signed up for, we're pleased to let you know you've been shortlisted for:</p>
          <div style="background:#F7F3E9;border-left:3px solid #E8A33D;border-radius:6px;padding:16px 20px;margin:0 0 22px;">
            <div style="font-size:16px;font-weight:bold;color:#14213D;">${job.title}</div>
            <div style="font-size:14px;color:#C1440E;margin-top:2px;">${job.company}</div>
          </div>
          <p style="margin:0 0 28px;">We'll be in touch shortly with next steps. If you'd like to ask anything in the meantime, our team is one tap away:</p>
        `,
        ctaHtml: whatsappButton(`Hi, I've been shortlisted for ${job.title} at ${job.company} and had a question.`),
      });

      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: process.env.ALERTS_FROM_EMAIL,
            to: person.email,
            subject,
            html: shortlistHtml,
          }),
        });

        if (res.ok) {
          sent++;
          await logMessage({ messageType: 'shortlist', recipientEmail: person.email, subject, relatedJobId: job.id, status: 'sent' });
        } else {
          failures.push(person.email);
          console.error('Shortlist send failed for', person.email, await res.text());
          await logMessage({ messageType: 'shortlist', recipientEmail: person.email, subject, relatedJobId: job.id, status: 'failed' });
        }
      } catch (err) {
        failures.push(person.email);
        console.error('Shortlist send error for', person.email, err);
        await logMessage({ messageType: 'shortlist', recipientEmail: person.email, subject, relatedJobId: job.id, status: 'failed' });
      }
    }

    return Response.json({ success: true, sent, total: people.length, failed: failures.length });
  } catch (err) {
    console.error('Shortlist route error:', err);
    return Response.json({ error: 'Unexpected error.' }, { status: 500 });
  }
}
