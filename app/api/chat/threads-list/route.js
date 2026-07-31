import { supabaseAdmin, isSupabaseConfigured } from '../../../../lib/supabaseAdmin';

export async function POST(request) {
  if (!isSupabaseConfigured) {
    return Response.json({ error: 'The site is not fully set up yet.' }, { status: 503 });
  }

  try {
    const { passcode } = await request.json();
    if (passcode !== process.env.ADMIN_PASSCODE) {
      return Response.json({ error: 'Wrong passcode.' }, { status: 401 });
    }

    const { data: threads, error } = await supabaseAdmin
      .from('chat_threads')
      .select('id, visitor_name, visitor_email, visitor_phone, status, created_at, last_message_at')
      .order('last_message_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Chat threads list fetch failed:', error.message);
      return Response.json({ error: 'Could not load conversations.' }, { status: 500 });
    }

    // Attach the last message preview + unread count for each thread
    const enriched = await Promise.all(
      (threads || []).map(async (t) => {
        const { data: lastMsg } = await supabaseAdmin
          .from('chat_messages')
          .select('message, sender, created_at')
          .eq('thread_id', t.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        const { count: unread } = await supabaseAdmin
          .from('chat_messages')
          .select('id', { count: 'exact', head: true })
          .eq('thread_id', t.id)
          .eq('sender', 'visitor')
          .eq('read_by_admin', false);

        return { ...t, last_message: lastMsg || null, unread_count: unread || 0 };
      })
    );

    return Response.json({ threads: enriched });
  } catch (err) {
    console.error('Chat threads-list route error:', err);
    return Response.json({ error: 'Unexpected error.' }, { status: 500 });
  }
}
