import { supabaseAdmin, isSupabaseConfigured } from '../../../lib/supabaseAdmin';

export async function POST(request) {
  if (!isSupabaseConfigured) {
    return Response.json({ error: 'The site is not fully set up yet.' }, { status: 503 });
  }

  try {
    const { passcode, status } = await request.json();
    if (passcode !== process.env.ADMIN_PASSCODE) {
      return Response.json({ error: 'Wrong passcode.' }, { status: 401 });
    }

    let query = supabaseAdmin
      .from('applications')
      .select('id, job_id, full_name, email, phone, cover_note, cv_url, status, created_at, jobs(title, company)')
      .order('created_at', { ascending: false })
      .limit(100);

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Applications list fetch failed:', error.message);
      return Response.json({ error: 'Could not load applications.' }, { status: 500 });
    }

    return Response.json({ applications: data || [] });
  } catch (err) {
    console.error('Applications-list route error:', err);
    return Response.json({ error: 'Unexpected error.' }, { status: 500 });
  }
}
