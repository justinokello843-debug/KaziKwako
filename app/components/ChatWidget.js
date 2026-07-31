'use client';

import { useState, useEffect, useRef } from 'react';

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [threadId, setThreadId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const pollRef = useRef(null);
  const bottomRef = useRef(null);

  // pre-chat form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [firstMessage, setFirstMessage] = useState('');

  // ongoing message input
  const [draft, setDraft] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('kazi_chat_thread_id');
    if (saved) setThreadId(saved);
  }, []);

  useEffect(() => {
    if (open && threadId) {
      loadMessages();
      pollRef.current = setInterval(loadMessages, 5000);
    }
    return () => clearInterval(pollRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, threadId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function loadMessages() {
    if (!threadId) return;
    try {
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ thread_id: threadId }),
      });
      const data = await res.json();
      if (res.ok) setMessages(data.messages);
    } catch (err) {
      // silent — next poll will try again
    }
  }

  async function startChat(e) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !firstMessage.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/chat/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitor_name: name, visitor_email: email, visitor_phone: phone, message: firstMessage }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Something went wrong.'); return; }
      localStorage.setItem('kazi_chat_thread_id', data.thread_id);
      setThreadId(data.thread_id);
      setFirstMessage('');
    } catch (err) {
      setError('Network error — try again.');
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage(e) {
    e.preventDefault();
    if (!draft.trim()) return;
    const text = draft.trim();
    setDraft('');
    setMessages((prev) => [...prev, { id: 'temp-' + Date.now(), sender: 'visitor', message: text, created_at: new Date().toISOString() }]);
    try {
      await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ thread_id: threadId, message: text }),
      });
      loadMessages();
    } catch (err) {
      setError('Message may not have sent — check your connection.');
    }
  }

  return (
    <>
      <button
        type="button"
        className="chat-bubble"
        onClick={() => setOpen((v) => !v)}
        aria-label="Chat with us"
      >
        {open ? '✕' : '💬'}
      </button>

      {open && (
        <div className="chat-panel">
          <div className="chat-panel-header">
            <span className="mark" style={{ width: 26, height: 26, fontSize: 11 }}>K</span>
            <div>
              <div className="chat-panel-title">Kazi Help Centre</div>
              <div className="chat-panel-subtitle">We usually reply within a few hours</div>
            </div>
          </div>

          {!threadId ? (
            <form onSubmit={startChat} className="chat-prechat">
              <p className="chat-prechat-lede">Tell us who you are, and what's up — we'll get right back to you.</p>
              <input type="text" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} required />
              <input type="email" placeholder="Your email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <input type="tel" placeholder="Phone (optional)" value={phone} onChange={(e) => setPhone(e.target.value)} />
              <textarea placeholder="How can we help?" rows={3} value={firstMessage} onChange={(e) => setFirstMessage(e.target.value)} required />
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
                {loading ? 'Starting…' : 'Start chat'}
              </button>
              {error && <p className="msg err" style={{ color: '#C1440E', fontSize: 12 }}>{error}</p>}
            </form>
          ) : (
            <>
              <div className="chat-messages">
                {messages.map((m) => (
                  <div key={m.id} className={`chat-bubble-msg ${m.sender === 'admin' ? 'from-admin' : 'from-visitor'}`}>
                    {m.message}
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
              <form onSubmit={sendMessage} className="chat-input-row">
                <input type="text" placeholder="Type a message…" value={draft} onChange={(e) => setDraft(e.target.value)} />
                <button type="submit" aria-label="Send">➤</button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
}
