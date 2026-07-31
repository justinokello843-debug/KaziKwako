/**
 * One shared visual shell for every automated email Kazi sends.
 * Each email type only supplies its own eyebrow label, heading, and body —
 * the header, footer, fonts, and colors are identical everywhere, always.
 * This is what keeps welcome emails, job alerts, broadcasts, and shortlist
 * notices all feeling like they came from the same, consistent company.
 */
export function renderEmail({ eyebrow, heading, bodyHtml, ctaHtml = '' }) {
  return `
<div style="background:#F7F3E9;padding:40px 20px;font-family:Georgia,'Times New Roman',serif;">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #E5E0D3;">

    <div style="background:#14213D;padding:28px 36px;">
      <span style="font-family:Georgia,serif;font-style:italic;font-size:26px;color:#F7F3E9;">Kazi</span>
    </div>

    <div style="padding:36px;">
      <p style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#C1440E;font-weight:bold;margin:0 0 18px;">
        ${eyebrow}
      </p>

      <h1 style="font-family:Georgia,serif;font-style:italic;font-weight:normal;font-size:26px;color:#14213D;margin:0 0 20px;line-height:1.3;">
        ${heading}
      </h1>

      <div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.65;color:#201C1C;">
        ${bodyHtml}
      </div>

      ${ctaHtml}

      <p style="font-family:Georgia,serif;font-style:italic;font-size:15px;color:#14213D;margin:26px 0 0;">
        The Kazi Team
      </p>
    </div>

    <div style="background:#EFE8D8;padding:18px 36px;">
      <p style="font-family:'Courier New',monospace;font-size:11px;color:#8a8478;margin:0;">
        Every job on Kazi is verified before it's posted — that's the whole business.
      </p>
    </div>

  </div>
</div>
  `;
}

/** A consistent CTA button pointing back to the site's live chat widget (bottom-left on every page). */
export function siteChatButton(label = 'Chat with us on Kazi') {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:6px 0 30px;">
      <tr>
        <td style="background:#14213D;border-radius:100px;">
          <a href="https://kazikwako.space" style="display:inline-block;padding:14px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:#F7F3E9;text-decoration:none;">
            💬&nbsp;&nbsp;${label}
          </a>
        </td>
      </tr>
    </table>
  `;
}
