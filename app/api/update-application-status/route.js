import { supabaseAdmin, isSupabaseConfigured } from '../../../lib/supabaseAdmin';

const VALID_STATUSES = ['new', 'reviewed', 'forwarded', 'rejected'];

export async function POST(request) {
  if (!isSupabaseConfigured) {
    return Response.json({ error: 'The site is not fully set up yet.' }, { status: 503 });
  }

  try {
    const { passcode, application_id, status } = await request.json();
    if (passcode !== process.env.ADMIN_PASSCODE) {
      return Response.json({ error: 'Wrong passcode.' }, { status: 401 });
    }
    if (!application_id || !VALID_STATUSES.includes(status)) {
      return Response.json({ error: 'A valid application_id and status are required.' }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from('applications').update({ status }).eq('id', application_id);

    if (error) {
      console.error('Application status update failed:', error.message);
      return Response.json({ error: 'Could not update status.' }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error('Update-application-status route error:', err);
    return Response.json({ error: 'Unexpected error.' }, { status: 500 });
  }
}
