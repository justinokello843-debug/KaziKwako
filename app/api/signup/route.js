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
    const formData = await request.formData();

    const full_name = formData.get('full_name')?.toString().trim();
    const email = formData.get('email')?.toString().trim().toLowerCase();
    const phone = formData.get('phone')?.toString().trim() || null;
    const role_interest = formData.get('role_interest')?.toString().trim();
    const location = formData.get('location')?.toString().trim() || null;
    const experience_level = formData.get('experience_level')?.toString().trim() || null;
    const cvFile = formData.get('cv'); // optional File

    if (!full_name || !email || !role_interest) {
      return Response.json(
        { error: 'Name, email, and the role you want alerts for are required.' },
        { status: 400 }
      );
    }

    let cv_url = null;

    // If they attached a CV, upload it to Supabase Storage (bucket: "cvs")
    if (cvFile && typeof cvFile === 'object' && cvFile.size > 0) {
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ];
      if (!allowedTypes.includes(cvFile.type)) {
        return Response.json(
          { error: 'CV must be a PDF or Word document.' },
          { status: 400 }
        );
      }
      if (cvFile.size > 5 * 1024 * 1024) {
        return Response.json({ error: 'CV must be under 5MB.' }, { status: 400 });
      }

      const bytes = await cvFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const safeName = `${Date.now()}-${cvFile.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`;
      const path = `${email}/${safeName}`;

      const { error: uploadError } = await supabaseAdmin.storage
        .from('cvs')
        .upload(path, buffer, { contentType: cvFile.type, upsert: true });

      if (uploadError) {
        console.error('CV upload failed:', uploadError.message);
        return Response.json({ error: 'Could not upload your CV. Try again.' }, { status: 500 });
      }

      const { data: signed } = await supabaseAdmin.storage
        .from('cvs')
        .createSignedUrl(path, 60 * 60 * 24 * 365); // valid 1 year
      cv_url = signed?.signedUrl || null;
    }

    // Insert or update (in case they sign up again with a new CV/role)
    const { error: dbError } = await supabaseAdmin
      .from('subscribers')
      .upsert(
        {
          full_name,
          email,
          phone,
          role_interest,
          location,
          experience_level,
          cv_url,
          subscribed: true,
        },
        { onConflict: 'email' }
      );

    if (dbError) {
      console.error('Signup insert failed:', dbError.message);
      return Response.json({ error: 'Something went wrong saving your details.' }, { status: 500 });
    }

    // Send a welcome email — failure here shouldn't fail the signup itself,
    // since their data is already safely saved either way.
    const firstName = full_name.split(' ')[0];
    const welcomeSubject = `Welcome to Kazi, ${firstName} — here's what happens next`;
    const welcomeHtml = renderEmail({
      eyebrow: 'Welcome to Kazi',
      heading: `You're all set, ${firstName}.`,
      bodyHtml: `
        <p style="margin:0 0 16px;">Thank you for signing up with Kazi. You're now set up to hear about verified <strong>${role_interest}</strong> roles the moment they go live — no need to keep checking back.</p>
        <p style="margin:0 0 16px;">Here's what makes Kazi different: every employer on the platform is checked — a real business, reviewed, before they're ever allowed to post. So when you get an email from us saying a job matches you, it's a real one, not a stale listing or a scam dressed up as an opportunity.</p>
        <p style="margin:0 0 16px;"><strong>What happens next:</strong> the moment a verified employer posts a role matching what you're looking for, you'll hear from us directly by email — no applying blind, no guessing whether the job's still open.</p>
        <p style="margin:0 0 24px;">In the meantime, if there's anything you'd like to ask, our team is one tap away:</p>
      `,
      ctaHtml: whatsappButton(`Hi, I just signed up on Kazi for ${role_interest} roles and had a question.`),
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
          to: email,
          subject: welcomeSubject,
          html: welcomeHtml,
        }),
      });
      await logMessage({
        messageType: 'welcome',
        recipientEmail: email,
        subject: welcomeSubject,
        status: res.ok ? 'sent' : 'failed',
      });
    } catch (emailErr) {
      console.error('Welcome email failed to send:', emailErr);
      await logMessage({ messageType: 'welcome', recipientEmail: email, subject: welcomeSubject, status: 'failed' });
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error('Signup route error:', err);
    return Response.json({ error: 'Unexpected error. Please try again.' }, { status: 500 });
  }
}
