import { supabaseAdmin, isSupabaseConfigured } from '../../../lib/supabaseAdmin';

export async function POST(request) {
  if (!isSupabaseConfigured) {
    return Response.json({ error: 'The site is not fully set up yet.' }, { status: 503 });
  }

  try {
    const { passcode } = await request.json();
    if (passcode !== process.env.ADMIN_PASSCODE) {
      return Response.json({ error: 'Wrong passcode.' }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from('jobs')
      .select('id, title, company, location, role_category, created_at')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Jobs list fetch failed:', error.message);
      return Response.json({ error: 'Could not load jobs.' }, { status: 500 });
    }

    return Response.json({ jobs: data || [] });
  } catch (err) {
    console.error('Jobs list route error:', err);
    return Response.json({ error: 'Unexpected error.' }, { status: 500 });
  }
}
