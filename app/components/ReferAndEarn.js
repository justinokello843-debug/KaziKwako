'use client';

import { useState } from 'react';

export default function ReferAndEarn({ link, jobTitle }) {
  const [copied, setCopied] = useState(false);

  function copyLink() {
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const whatsappShare = `https://wa.me/?text=${encodeURIComponent(
    `Hey! I just applied for "${jobTitle}" on Kazi — a job platform that only lists verified, real employers. Thought of you — check it out and apply here: ${link}`
  )}`;

  return (
    <div className="refer-panel">
      <div className="refer-badge">🎉 Refer &amp; Earn</div>
      <h4 className="refer-heading">Share this role, earn real cash.</h4>
      <p className="refer-copy">
        Send your unique link to friends and family. When <strong>5 people</strong> sign up or apply through it, you earn{' '}
        <strong className="refer-amount">up to $80</strong>. Get <strong>15 people</strong>, and that climbs to{' '}
        <strong className="refer-amount">up to $300</strong>.
      </p>

      <div className="refer-link-row">
        <input type="text" readOnly value={link} onFocus={(e) => e.target.select()} />
        <button type="button" onClick={copyLink} className="refer-copy-btn">
          {copied ? '✓ Copied' : 'Copy link'}
        </button>
      </div>

      <a href={whatsappShare} target="_blank" rel="noopener noreferrer" className="refer-whatsapp-btn">
        💬&nbsp;&nbsp;Share on WhatsApp
      </a>

      <p className="refer-fineprint">*Rewards are paid out once qualifying referrals are confirmed. Terms apply.</p>
    </div>
  );
}
