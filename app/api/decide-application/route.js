import { supabaseAdmin, isSupabaseConfigured } from '../../../lib/supabaseAdmin';
import { logMessage } from '../../../lib/messageLog';
import { renderEmail, whatsappButton } from '../../../lib/emailTemplate';

export async function POST(request) {
  if (!isSupabaseConfigured) {
    return Response.json({ error: 'The site is not fully set up yet.' }, { status: 503 });
  }

  try {
    const { passcode, application_id, decision } = await request.json();

    if (passcode !== process.env.ADMIN_PASSCODE) {
      return Response.json({ error: 'Wrong passcode.' }, { status: 401 });
    }
    if (!application_id || !['shortlist', 'reject'].includes(decision)) {
      return Response.json({ error: 'A valid application_id and decision (shortlist or reject) are required.' }, { status: 400 });
    }

    const { data: application, error: fetchError } = await supabaseAdmin
      .from('applications')
      .select('id, full_name, email, job_id, status, jobs(title, company)')
      .eq('id', application_id)
      .single();

    if (fetchError || !application) {
      return Response.json({ error: 'Application not found.' }, { status: 404 });
    }

    const previousStatus = application.status;
    const newStatus = decision === 'shortlist' ? 'shortlisted' : 'rejected';
    const { error: updateError } = await supabaseAdmin
      .from('applications')
      .update({ status: newStatus })
      .eq('id', application_id);

    if (updateError) {
      console.error('Application status update failed:', updateError.message);
      return Response.json({ error: 'Could not update the application status.' }, { status: 500 });
    }

    const firstName = application.full_name ? application.full_name.split(' ')[0] : 'there';
    const jobTitle = application.jobs?.title || 'the role';
    const jobCompany = application.jobs?.company || '';

    let subject, html, messageType;

    if (decision === 'shortlist') {
      messageType = 'shortlist';
      subject = `You've been shortlisted for ${jobTitle}${jobCompany ? ' at ' + jobCompany : ''}`;
      html = renderEmail({
        eyebrow: 'Shortlist Confirmed',
        heading: `Congratulations, ${firstName} — you've been shortlisted.`,
        bodyHtml: `
          <p style="margin:0 0 16px;">After reviewing your application, we're pleased to let you know you've been shortlisted for:</p>
          <div style="background:#F7F3E9;border-left:3px solid #E8A33D;border-radius:6px;padding:16px 20px;margin:0 0 22px;">
            <div style="font-size:16px;font-weight:bold;color:#14213D;">${jobTitle}</div>
            ${jobCompany ? `<div style="font-size:14px;color:#C1440E;margin-top:2px;">${jobCompany}</div>` : ''}
          </div>
          <p style="margin:0 0 28px;">We'll be in touch shortly with next steps. If you'd like to ask anything in the meantime, our team is one tap away:</p>
        `,
        ctaHtml: whatsappButton(`Hi, I've been shortlisted for ${jobTitle}${jobCompany ? ' at ' + jobCompany : ''} and had a question.`),
      });
    } else {
      messageType = 'rejection';
      const wasPreviouslyShortlisted = previousStatus === 'shortlisted' || previousStatus === 'forwarded';

      if (wasPreviouslyShortlisted) {
        subject = `An update on ${jobTitle}${jobCompany ? ' at ' + jobCompany : ''}`;
        html = renderEmail({
          eyebrow: 'Application Update',
          heading: `An update on your shortlist, ${firstName}.`,
          bodyHtml: `
            <p style="margin:0 0 16px;">We let you know earlier that you'd been shortlisted for:</p>
            <div style="background:#F7F3E9;border-left:3px solid #C1440E;border-radius:6px;padding:16px 20px;margin:0 0 22px;">
              <div style="font-size:16px;font-weight:bold;color:#14213D;">${jobTitle}</div>
              ${jobCompany ? `<div style="font-size:14px;color:#C1440E;margin-top:2px;">${jobCompany}</div>` : ''}
            </div>
            <p style="margin:0 0 16px;">Since then, the employer made their final decision, and unfortunately they've chosen to move forward with another candidate this time. Being shortlisted meant your application genuinely stood out — this final step often comes down to very fine margins, not a reflection of your ability.</p>
            <p style="margin:0 0 28px;">Please don't let this discourage you — new verified roles go live on Kazi regularly, and we'd like to see you land one. If you have any questions, our team is one tap away:</p>
          `,
          ctaHtml: whatsappButton(`Hi, I had a question about my application for ${jobTitle}${jobCompany ? ' at ' + jobCompany : ''}.`),
        });
      } else {
        subject = `An update on your application for ${jobTitle}${jobCompany ? ' at ' + jobCompany : ''}`;
        html = renderEmail({
          eyebrow: 'Application Update',
          heading: `Thank you for applying, ${firstName}.`,
          bodyHtml: `
            <p style="margin:0 0 16px;">After careful review, we won't be moving forward with your application for:</p>
            <div style="background:#F7F3E9;border-left:3px solid #C1440E;border-radius:6px;padding:16px 20px;margin:0 0 22px;">
              <div style="font-size:16px;font-weight:bold;color:#14213D;">${jobTitle}</div>
              ${jobCompany ? `<div style="font-size:14px;color:#C1440E;margin-top:2px;">${jobCompany}</div>` : ''}
            </div>
            <p style="margin:0 0 16px;">This isn't a reflection of your worth or potential — hiring decisions come down to a specific, narrow fit for one role at one moment, nothing more. Please don't let this discourage you from continuing to apply.</p>
            <p style="margin:0 0 28px;">New verified roles go live on Kazi regularly, and we'd genuinely love to see you land one. If you have any questions, our team is one tap away:</p>
          `,
          ctaHtml: whatsappButton(`Hi, I had a question about my application for ${jobTitle}${jobCompany ? ' at ' + jobCompany : ''}.`),
        });
      }
    }

    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ from: process.env.ALERTS_FROM_EMAIL, to: application.email, subject, html }),
      });
      await logMessage({
        messageType,
        recipientEmail: application.email,
        subject,
        relatedJobId: application.job_id,
        status: res.ok ? 'sent' : 'failed',
      });

      if (!res.ok) {
        console.error('Decision email failed to send:', await res.text());
        return Response.json({ success: true, emailed: false, warning: 'Status updated, but the email failed to send.' });
      }
    } catch (emailErr) {
      console.error('Decision email error:', emailErr);
      await logMessage({ messageType, recipientEmail: application.email, subject, relatedJobId: application.job_id, status: 'failed' });
      return Response.json({ success: true, emailed: false, warning: 'Status updated, but the email failed to send.' });
    }

    return Response.json({ success: true, emailed: true, status: newStatus });
  } catch (err) {
    console.error('Decide-application route error:', err);
    return Response.json({ error: 'Unexpected error. Please try again.' }, { status: 500 });
  }
}
