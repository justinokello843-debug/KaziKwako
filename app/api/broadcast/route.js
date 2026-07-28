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
    const { passcode, subject, message, role_filter, location_filter } = body;

    if (passcode !== process.env.ADMIN_PASSCODE) {
      return Response.json({ error: 'Wrong passcode.' }, { status: 401 });
    }

    if (!subject || !message) {
      return Response.json({ error: 'Subject and message are required.' }, { status: 400 });
    }

    // Start from everyone still subscribed
    let query = supabaseAdmin.from('subscribers').select('id, email, full_name, role_interest, location').eq('subscribed', true);

    // Optional narrowing — leave both blank to reach everyone
    if (role_filter && role_filter.trim()) {
      query = query.ilike('role_interest', `%${role_filter.trim()}%`);
    }
    if (location_filter && location_filter.trim()) {
      query = query.ilike('location', `%${location_filter.trim()}%`);
    }

    const { data: recipients, error: fetchError } = await query;

    if (fetchError) {
      console.error('Broadcast recipient lookup failed:', fetchError.message);
      return Response.json({ error: 'Could not look up subscribers.' }, { status: 500 });
    }

    if (!recipients || recipients.length === 0) {
      return Response.json({ success: true, sent: 0, warning: 'No subscribers matched — nothing was sent.' });
    }

    let sent = 0;
    const failures = [];

    for (const person of recipients) {
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
            html: `
              <p>Hi ${person.full_name || 'there'},</p>
              <div>${String(message).replace(/\n/g, '<br/>')}</div>
              <hr/>
              <p style="font-size:12px;color:#888;">You're getting this because you signed up for Kazi job alerts. Reply "unsubscribe" any time to stop.</p>
            `,
          }),
        });

        if (res.ok) {
          sent++;
        } else {
          failures.push(person.email);
          console.error('Broadcast send failed for', person.email, await res.text());
        }
      } catch (err) {
        failures.push(person.email);
        console.error('Broadcast send error for', person.email, err);
      }
    }

    return Response.json({ success: true, sent, total: recipients.length, failed: failures.length });
  } catch (err) {
    console.error('Broadcast route error:', err);
    return Response.json({ error: 'Unexpected error. Please try again.' }, { status: 500 });
  }
}
