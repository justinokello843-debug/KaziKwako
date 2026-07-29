import { supabaseAdmin, isSupabaseConfigured } from '../../../lib/supabaseAdmin';
import { logMessage } from '../../../lib/messageLog';
import { renderEmail, whatsappButton } from '../../../lib/emailTemplate';

export async function POST(request) {
  if (!isSupabaseConfigured) {
    return Response.json(
      { error: 'The site is not fully set up yet — the database keys are missing. Contact the site owner.' },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const { passcode, title, company, location, role_category, job_type, salary_range, description, apply_url } = body;

    // MVP gate for the admin page — see README for upgrading this to real auth.
    if (passcode !== process.env.ADMIN_PASSCODE) {
      return Response.json({ error: 'Wrong passcode.' }, { status: 401 });
    }

    if (!title || !company || !location || !role_category || !description) {
      return Response.json({ error: 'Title, company, location, role category, and description are required.' }, { status: 400 });
    }

    // 1. Save the job
    const { data: job, error: jobError } = await supabaseAdmin
      .from('jobs')
      .insert({ title, company, location, role_category, job_type, salary_range, description, apply_url })
      .select()
      .single();

    if (jobError) {
      console.error('Job insert failed:', jobError.message);
      return Response.json({ error: 'Could not save the job.' }, { status: 500 });
    }

    // 2. Find subscribers whose interest roughly matches this job
    //    (case-insensitive partial match on role, plus location or remote match)
    const { data: matches, error: matchError } = await supabaseAdmin
      .from('subscribers')
      .select('id, email, full_name, role_interest, location')
      .eq('subscribed', true)
      .ilike('role_interest', `%${role_category}%`);

    if (matchError) {
      console.error('Match query failed:', matchError.message);
      // Job is already saved, so we don't fail the whole request — just skip notifying.
      return Response.json({ success: true, job, notified: 0, warning: 'Job posted, but matching subscribers failed.' });
    }

    const relevant = (matches || []).filter(
      (s) =>
        !s.location ||
        s.location.toLowerCase() === location.toLowerCase() ||
        s.location.toLowerCase() === 'remote' ||
        location.toLowerCase() === 'remote'
    );

    // 3. Email each matching subscriber via Resend
    let notified = 0;
    for (const sub of relevant) {
      const alertSubject = `New match: ${title} at ${company}`;
      const alertHtml = renderEmail({
        eyebrow: 'New Match',
        heading: `A new ${sub.role_interest} role just went live.`,
        bodyHtml: `
          <p style="margin:0 0 16px;">A verified job matching what you signed up for was just posted:</p>
          <div style="background:#F7F3E9;border-left:3px solid #E8A33D;border-radius:6px;padding:16px 20px;margin:0 0 22px;">
            <div style="font-size:16px;font-weight:bold;color:#14213D;">${title}</div>
            <div style="font-size:14px;color:#C1440E;margin-top:2px;">${company}</div>
            <div style="font-size:13px;color:#6b6b6b;margin-top:8px;">${location} · ${job_type || 'Full-time'}${salary_range ? ' · ' + salary_range : ''}</div>
          </div>
          <p style="margin:0 0 24px;">${description.slice(0, 240)}${description.length > 240 ? '…' : ''}</p>
          ${apply_url ? `<p style="margin:0 0 24px;"><a href="${apply_url}" style="color:#14213D;font-weight:bold;">Apply here →</a></p>` : ''}
        `,
        ctaHtml: whatsappButton(`Hi, I got an alert for ${title} at ${company} and had a question.`),
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
            to: sub.email,
            subject: alertSubject,
            html: alertHtml,
          }),
        });

        if (res.ok) {
          notified++;
          await supabaseAdmin.from('notifications_log').insert({ job_id: job.id, subscriber_id: sub.id });
          await logMessage({ messageType: 'job_alert', recipientEmail: sub.email, subject: alertSubject, relatedJobId: job.id, status: 'sent' });
        } else {
          console.error('Resend failed for', sub.email, await res.text());
          await logMessage({ messageType: 'job_alert', recipientEmail: sub.email, subject: alertSubject, relatedJobId: job.id, status: 'failed' });
        }
      } catch (emailErr) {
        console.error('Email send error for', sub.email, emailErr);
        await logMessage({ messageType: 'job_alert', recipientEmail: sub.email, subject: alertSubject, relatedJobId: job.id, status: 'failed' });
      }
    }

    return Response.json({ success: true, job, notified });
  } catch (err) {
    console.error('Post-job route error:', err);
    return Response.json({ error: 'Unexpected error. Please try again.' }, { status: 500 });
  }
}
