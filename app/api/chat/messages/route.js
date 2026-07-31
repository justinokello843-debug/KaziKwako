import { supabaseAdmin, isSupabaseConfigured } from '../../../../lib/supabaseAdmin';

export async function POST(request) {
  if (!isSupabaseConfigured) {
    return Response.json({ error: 'The site is not fully set up yet.' }, { status: 503 });
  }

  try {
    const { thread_id } = await request.json();
    if (!thread_id) {
      return Response.json({ error: 'thread_id is required.' }, { status: 400 });
    }

    const { data: messages, error } = await supabaseAdmin
      .from('chat_messages')
      .select('id, sender, message, created_at')
      .eq('thread_id', thread_id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Chat messages fetch failed:', error.message);
      return Response.json({ error: 'Could not load messages.' }, { status: 500 });
    }

    // Mark any admin messages as seen by the visitor, now that they're fetching them
    await supabaseAdmin
      .from('chat_messages')
      .update({ read_by_visitor: true })
      .eq('thread_id', thread_id)
      .eq('sender', 'admin')
      .eq('read_by_visitor', false);

    return Response.json({ messages: messages || [] });
  } catch (err) {
    console.error('Chat messages route error:', err);
    return Response.json({ error: 'Unexpected error.' }, { status: 500 });
  }
}
