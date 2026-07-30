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
      .from('subscribers')
      .select('id, full_name, email, phone, role_interest, location, experience_level, cv_url, created_at')
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) {
      console.error('Subscribers list fetch failed:', error.message);
      return Response.json({ error: 'Could not load subscribers.' }, { status: 500 });
    }

    return Response.json({ subscribers: data || [] });
  } catch (err) {
    console.error('Subscribers-list route error:', err);
    return Response.json({ error: 'Unexpected error.' }, { status: 500 });
  }
}
