import { supabaseAdmin, isSupabaseConfigured } from '../../../lib/supabaseAdmin';

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
            subject: `New match: ${title} at ${company}`,
            html: `
              <p>Hi ${sub.full_name || 'there'},</p>
              <p>A new role matching <strong>${sub.role_interest}</strong> was just posted:</p>
              <h2>${title} — ${company}</h2>
              <p>${location} · ${job_type || ''} ${salary_range ? '· ' + salary_range : ''}</p>
              <p>${description.slice(0, 240)}${description.length > 240 ? '…' : ''}</p>
              ${apply_url ? `<p><a href="${apply_url}">Apply here</a></p>` : ''}
              <hr/>
              <p style="font-size:12px;color:#888;">You're getting this because you signed up for Kazi job alerts for "${sub.role_interest}". You can unsubscribe any time by replying to this email.</p>
            `,
          }),
        });

        if (res.ok) {
          notified++;
          await supabaseAdmin.from('notifications_log').insert({ job_id: job.id, subscriber_id: sub.id });
        } else {
          console.error('Resend failed for', sub.email, await res.text());
        }
      } catch (emailErr) {
        console.error('Email send error for', sub.email, emailErr);
      }
    }

    return Response.json({ success: true, job, notified });
  } catch (err) {
    console.error('Post-job route error:', err);
    return Response.json({ error: 'Unexpected error. Please try again.' }, { status: 500 });
  }
}
