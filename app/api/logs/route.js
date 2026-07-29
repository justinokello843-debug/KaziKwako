import { supabaseAdmin, isSupabaseConfigured } from '../../../lib/supabaseAdmin';

export async function POST(request) {
  if (!isSupabaseConfigured) {
    return Response.json({ error: 'The site is not fully set up yet.' }, { status: 503 });
  }

  try {
    const { passcode, message_type } = await request.json();
    if (passcode !== process.env.ADMIN_PASSCODE) {
      return Response.json({ error: 'Wrong passcode.' }, { status: 401 });
    }

    let query = supabaseAdmin
      .from('message_log')
      .select('id, message_type, recipient_email, subject, related_job_id, status, sent_at')
      .order('sent_at', { ascending: false })
      .limit(100);

    if (message_type && message_type !== 'all') {
      query = query.eq('message_type', message_type);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Log fetch failed:', error.message);
      return Response.json({ error: 'Could not load the message log.' }, { status: 500 });
    }

    return Response.json({ entries: data || [] });
  } catch (err) {
    console.error('Logs route error:', err);
    return Response.json({ error: 'Unexpected error.' }, { status: 500 });
  }
}
