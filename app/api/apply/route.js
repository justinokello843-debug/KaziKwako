import { supabaseAdmin, isSupabaseConfigured } from '../../../lib/supabaseAdmin';
import { logMessage } from '../../../lib/messageLog';
import { renderEmail, siteChatButton } from '../../../lib/emailTemplate';
import { getOrCreateReferralCode, recordReferralEvent } from '../../../lib/referral';

export async function POST(request) {
  if (!isSupabaseConfigured) {
    return Response.json(
      { error: 'The site is not fully set up yet — the database keys are missing. Contact the site owner.' },
      { status: 503 }
    );
  }

  try {
    const formData = await request.formData();

    const job_id = formData.get('job_id')?.toString().trim();
    const full_name = formData.get('full_name')?.toString().trim();
    const email = formData.get('email')?.toString().trim().toLowerCase();
    const phone = formData.get('phone')?.toString().trim() || null;
    const cover_note = formData.get('cover_note')?.toString().trim() || null;
    const cvFile = formData.get('cv');
    const incomingRefCode = formData.get('ref_code')?.toString().trim().toUpperCase() || null;

    if (!job_id || !full_name || !email) {
      return Response.json({ error: 'Name, email, and the job you\'re applying to are required.' }, { status: 400 });
    }

    // Confirm the job actually exists before accepting an application against it
    const { data: job, error: jobError } = await supabaseAdmin
      .from('jobs')
      .select('id, title, company')
      .eq('id', job_id)
      .single();

    if (jobError || !job) {
      return Response.json({ error: 'This job could not be found — it may have been removed.' }, { status: 404 });
    }

    let cv_url = null;

    // CV is required for a real application — this is how you screen people
    if (!cvFile || typeof cvFile !== 'object' || cvFile.size === 0) {
      return Response.json({ error: 'Please attach your CV to apply.' }, { status: 400 });
    }

    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!allowedTypes.includes(cvFile.type)) {
      return Response.json({ error: 'CV must be a PDF or Word document.' }, { status: 400 });
    }
    if (cvFile.size > 5 * 1024 * 1024) {
      return Response.json({ error: 'CV must be under 5MB.' }, { status: 400 });
    }

    const bytes = await cvFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const safeName = `${Date.now()}-${cvFile.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`;
    const path = `applications/${job_id}/${email}/${safeName}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from('cvs')
      .upload(path, buffer, { contentType: cvFile.type, upsert: true });

    if (uploadError) {
      console.error('Application CV upload failed:', uploadError.message);
      return Response.json({ error: 'Could not upload your CV. Please try again.' }, { status: 500 });
    }

    const { data: signed } = await supabaseAdmin.storage
      .from('cvs')
      .createSignedUrl(path, 60 * 60 * 24 * 365);
    cv_url = signed?.signedUrl || null;

    const { error: dbError } = await supabaseAdmin.from('applications').insert({
      job_id,
      full_name,
      email,
      phone,
      cover_note,
      cv_url,
      status: 'new',
    });

    if (dbError) {
      console.error('Application insert failed:', dbError.message);
      return Response.json({ error: 'Something went wrong saving your application.' }, { status: 500 });
    }

    // Confirmation email to the applicant — same branded template as every other automation
    const firstName = full_name.split(' ')[0];
    const subject = `We've received your application for ${job.title} at ${job.company}`;
    const html = renderEmail({
      eyebrow: 'Application Received',
      heading: `Thanks, ${firstName} — we've got it.`,
      bodyHtml: `
        <p style="margin:0 0 16px;">Your application for <strong>${job.title}</strong> at <strong>${job.company}</strong> has been received.</p>
        <p style="margin:0 0 16px;">Here's what happens next: our team reviews every CV that comes in, and forwards a shortlist of the strongest candidates directly to the employer. If you're selected, you'll hear from us.</p>
        <p style="margin:0 0 24px;">If you'd like to ask anything in the meantime, our team is one tap away:</p>
      `,
      ctaHtml: siteChatButton('Questions? Chat with us on Kazi'),
    });

    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ from: process.env.ALERTS_FROM_EMAIL, to: email, subject, html }),
      });
      await logMessage({ messageType: 'application', recipientEmail: email, subject, relatedJobId: job_id, status: res.ok ? 'sent' : 'failed' });
    } catch (emailErr) {
      console.error('Application confirmation email failed:', emailErr);
      await logMessage({ messageType: 'application', recipientEmail: email, subject, relatedJobId: job_id, status: 'failed' });
    }

    // If they arrived via someone else's referral link, credit that person —
    // silently skipped if the code is invalid, self-referred, or already counted
    if (incomingRefCode) {
      await recordReferralEvent({ code: incomingRefCode, referredEmail: email, eventType: 'application', jobId: job_id });
    }

    // Every applicant gets their own referral code to share going forward
    let referralCode = null;
    try {
      referralCode = await getOrCreateReferralCode({ full_name, email });
    } catch (refErr) {
      console.error('Referral code generation failed (non-fatal):', refErr);
    }

    return Response.json({
      success: true,
      referral: referralCode
        ? { code: referralCode, link: `https://kazikwako.space/jobs/${job_id}?ref=${referralCode}` }
        : null,
    });
  } catch (err) {
    console.error('Apply route error:', err);
    return Response.json({ error: 'Unexpected error. Please try again.' }, { status: 500 });
  }
}
