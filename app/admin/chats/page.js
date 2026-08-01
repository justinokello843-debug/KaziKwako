'use client';

import { useState, useEffect } from 'react';
import AdminGate, { usePasscode } from '../../components/AdminGate';

function ChatInbox() {
  const passcode = usePasscode();
  const [threads, setThreads] = useState(null);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState('');
  const [status, setStatus] = useState('idle');
  const [sending, setSending] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [message, setMessage] = useState('');

  async function loadThreads() {
    setStatus('loading');
    setMessage('');
    try {
      const res = await fetch('/api/chat/threads-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode }),
      });
      const data = await res.json();
      if (!res.ok) { setStatus('error'); setMessage(data.error || 'Could not load conversations.'); return; }
      setThreads(data.threads);
      setStatus('idle');
      if (data.threads.length === 0) setMessage('No conversations yet.');
    } catch (err) {
      setStatus('error'); setMessage('Network error — try again.');
    }
  }

  useEffect(() => { loadThreads(); /* eslint-disable-next-line */ }, []);

  async function openThread(threadId) {
    setConfirmDeleteId(null);
    try {
      const res = await fetch('/api/chat/thread', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode, thread_id: threadId }),
      });
      const data = await res.json();
      if (!res.ok) return;
      setSelected(data.thread);
      setMessages(data.messages);
      loadThreads();
    } catch (err) {}
  }

  async function sendReply(e) {
    e.preventDefault();
    if (!reply.trim() || !selected) return;
    setSending(true);
    try {
      const res = await fetch('/api/chat/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode, thread_id: selected.id, message: reply.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessages((prev) => [...prev, { id: 'temp-' + Date.now(), sender: 'admin', message: reply.trim(), created_at: new Date().toISOString() }]);
        setReply('');
        if (!data.emailed) setMessage('Reply saved, but the email to the client failed to send.');
      }
    } catch (err) {
      setMessage('Network error sending reply.');
    } finally {
      setSending(false);
    }
  }

  async function deleteThread(threadId) {
    setDeletingId(threadId);
    try {
      const res = await fetch('/api/chat/delete-thread', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode, thread_id: threadId }),
      });
      if (res.ok) {
        setThreads((prev) => prev.filter((t) => t.id !== threadId));
        if (selected?.id === threadId) { setSelected(null); setMessages([]); }
      } else {
        setMessage('Could not delete this conversation.');
      }
    } catch (err) {
      setMessage('Network error — could not delete.');
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  }

  return (
    <div className="admin-card" style={{ marginTop: 0 }}>
      <h2 className="display" style={{ fontStyle: 'italic', fontSize: 22 }}>All conversations</h2>
      <p className="sub">Every chat started from the bubble on your site. Reply here to email the client instantly — delete a conversation once it's wrapped up to keep this list tidy.</p>

      <button type="button" className="btn" onClick={loadThreads} disabled={status === 'loading'}>
        {status === 'loading' ? 'Loading…' : 'Refresh'}
      </button>
      {message && <p className="msg err">{message}</p>}

      <div className={`chat-inbox-grid ${selected ? 'has-selection' : ''}`} style={{ marginTop: 20 }}>
        {threads && threads.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 560, overflowY: 'auto' }}>
            {threads.map((t) => (
              <div
                key={t.id}
                style={{
                  background: selected?.id === t.id ? 'rgba(232,163,61,.15)' : 'rgba(247,243,233,.06)',
                  border: `1px solid ${selected?.id === t.id ? 'var(--gold)' : 'rgba(247,243,233,.15)'}`,
                  borderRadius: 10, padding: '12px 14px', fontSize: 13,
                }}
              >
                <button
                  type="button"
                  onClick={() => openThread(t.id)}
                  style={{ textAlign: 'left', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', width: '100%', padding: 0, font: 'inherit' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong>{t.visitor_name}</strong>
                    {t.unread_count > 0 && (
                      <span style={{ background: '#C1440E', color: '#fff', borderRadius: 100, fontSize: 10, padding: '2px 7px', fontWeight: 700 }}>
                        {t.unread_count}
                      </span>
                    )}
                  </div>
                  <div style={{ opacity: 0.6, fontSize: 11.5, marginTop: 2 }}>{t.visitor_email}</div>
                  {t.last_message && (
                    <div style={{ opacity: 0.75, fontSize: 12, marginTop: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.last_message.sender === 'admin' ? 'You: ' : ''}{t.last_message.message}
                    </div>
                  )}
                  <div className="mono" style={{ fontSize: 10, opacity: 0.45, marginTop: 6 }}>{new Date(t.last_message_at).toLocaleString()}</div>
                </button>

                {confirmDeleteId === t.id ? (
                  <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center' }}>
                    <span style={{ fontSize: 11.5, color: '#ff9b7a' }}>Delete this conversation permanently?</span>
                    <button
                      type="button" onClick={() => deleteThread(t.id)} disabled={deletingId === t.id}
                      style={{ background: '#C1440E', color: '#fff', border: 'none', borderRadius: 100, padding: '4px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                    >
                      {deletingId === t.id ? '…' : 'Yes, delete'}
                    </button>
                    <button
                      type="button" onClick={() => setConfirmDeleteId(null)}
                      style={{ background: 'none', color: 'rgba(247,243,233,.6)', border: '1px solid rgba(247,243,233,.2)', borderRadius: 100, padding: '4px 12px', fontSize: 11, cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button" onClick={() => setConfirmDeleteId(t.id)}
                    style={{ background: 'none', border: 'none', color: 'rgba(247,243,233,.4)', fontSize: 11, cursor: 'pointer', marginTop: 8, padding: 0, textDecoration: 'underline' }}
                  >
                    Delete conversation
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {selected && (
          <div style={{ display: 'flex', flexDirection: 'column', border: '1px solid rgba(247,243,233,.15)', borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', background: 'rgba(247,243,233,.06)', fontSize: 12.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span><strong>{selected.visitor_name}</strong> · {selected.visitor_email}{selected.visitor_phone ? ` · ${selected.visitor_phone}` : ''}</span>
              <button type="button" onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: 'rgba(247,243,233,.5)', cursor: 'pointer', fontSize: 16 }}>✕</button>
            </div>
            <div style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 420, overflowY: 'auto' }}>
              {messages.map((m) => (
                <div
                  key={m.id}
                  style={{
                    alignSelf: m.sender === 'admin' ? 'flex-end' : 'flex-start',
                    background: m.sender === 'admin' ? 'var(--gold)' : 'rgba(247,243,233,.1)',
                    color: m.sender === 'admin' ? 'var(--ink)' : 'var(--parchment)',
                    padding: '9px 13px', borderRadius: 12, fontSize: 13, maxWidth: '80%',
                  }}
                >
                  {m.message}
                </div>
              ))}
            </div>
            <form onSubmit={sendReply} style={{ display: 'flex', gap: 8, padding: 12, borderTop: '1px solid rgba(247,243,233,.12)' }}>
              <input
                type="text" value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Type a reply…"
                style={{ flex: 1, background: 'rgba(247,243,233,.08)', border: '1px solid rgba(247,243,233,.18)', borderRadius: 100, padding: '9px 14px', color: 'var(--parchment)', fontSize: 13 }}
              />
              <button type="submit" className="btn" style={{ marginTop: 0, padding: '9px 18px' }} disabled={sending || !reply.trim()}>
                {sending ? '…' : 'Send'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminChatsPage() {
  return (
    <AdminGate title="Live Chat Inbox" subtitle="Every conversation, in one place — reply instantly, delete once it's resolved.">
      <ChatInbox />
    </AdminGate>
  );
}
