import { supabaseAdmin, isSupabaseConfigured } from '../../../../lib/supabaseAdmin';

export async function POST(request) {
  if (!isSupabaseConfigured) {
    return Response.json({ error: 'The site is not fully set up yet.' }, { status: 503 });
  }

  try {
    const { passcode, thread_id } = await request.json();
    if (passcode !== process.env.ADMIN_PASSCODE) {
      return Response.json({ error: 'Wrong passcode.' }, { status: 401 });
    }
    if (!thread_id) {
      return Response.json({ error: 'thread_id is required.' }, { status: 400 });
    }

    // Deleting the thread cascades to delete its messages too (see schema:
    // chat_messages.thread_id references chat_threads(id) on delete cascade)
    const { error } = await supabaseAdmin.from('chat_threads').delete().eq('id', thread_id);

    if (error) {
      console.error('Chat thread delete failed:', error.message);
      return Response.json({ error: 'Could not delete this conversation.' }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error('Delete-thread route error:', err);
    return Response.json({ error: 'Unexpected error.' }, { status: 500 });
  }
}
