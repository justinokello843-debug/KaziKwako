import { supabaseAdmin, isSupabaseConfigured } from '../../../lib/supabaseAdmin';

export async function POST(request) {
  if (!isSupabaseConfigured) {
    return Response.json({ error: 'The site is not fully set up yet.' }, { status: 503 });
  }

  try {
    const { passcode, job_id } = await request.json();
    if (passcode !== process.env.ADMIN_PASSCODE) {
      return Response.json({ error: 'Wrong passcode.' }, { status: 401 });
    }
    if (!job_id) {
      return Response.json({ error: 'job_id is required.' }, { status: 400 });
    }

    const { data: job, error: jobError } = await supabaseAdmin
      .from('jobs')
      .select('id, title, company, location, role_category')
      .eq('id', job_id)
      .single();

    if (jobError || !job) {
      return Response.json({ error: 'Job not found.' }, { status: 404 });
    }

    // Same matching rule used for job-alert emails: role interest overlaps the
    // job's role category, and location either matches or either side is remote.
    const { data: matches, error: matchError } = await supabaseAdmin
      .from('subscribers')
      .select('id, full_name, email, role_interest, location, cv_url')
      .eq('subscribed', true)
      .ilike('role_interest', `%${job.role_category}%`);

    if (matchError) {
      console.error('Candidate lookup failed:', matchError.message);
      return Response.json({ error: 'Could not look up candidates.' }, { status: 500 });
    }

    const eligible = (matches || []).filter(
      (s) =>
        !s.location ||
        s.location.toLowerCase() === job.location.toLowerCase() ||
        s.location.toLowerCase() === 'remote' ||
        job.location.toLowerCase() === 'remote'
    );

    return Response.json({ job, candidates: eligible });
  } catch (err) {
    console.error('Shortlist-candidates route error:', err);
    return Response.json({ error: 'Unexpected error.' }, { status: 500 });
  }
}
