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

    const { data: thread, error: threadError } = await supabaseAdmin
      .from('chat_threads')
      .select('*')
      .eq('id', thread_id)
      .single();

    if (threadError || !thread) {
      return Response.json({ error: 'Conversation not found.' }, { status: 404 });
    }

    const { data: messages, error: msgError } = await supabaseAdmin
      .from('chat_messages')
      .select('id, sender, message, created_at')
      .eq('thread_id', thread_id)
      .order('created_at', { ascending: true });

    if (msgError) {
      return Response.json({ error: 'Could not load messages.' }, { status: 500 });
    }

    await supabaseAdmin
      .from('chat_messages')
      .update({ read_by_admin: true })
      .eq('thread_id', thread_id)
      .eq('sender', 'visitor')
      .eq('read_by_admin', false);

    return Response.json({ thread, messages: messages || [] });
  } catch (err) {
    console.error('Chat thread route error:', err);
    return Response.json({ error: 'Unexpected error.' }, { status: 500 });
  }
}
