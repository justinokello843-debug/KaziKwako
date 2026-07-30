import { supabaseAdmin } from './supabaseAdmin';

const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no 0/O or 1/I — avoids confusing codes when read aloud

function randomCode(length = 7) {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

/**
 * Returns the person's existing referral code, or creates a new one.
 * One code per email, forever — applying to multiple jobs doesn't create
 * multiple codes, so their total referral count stays in one place.
 */
export async function getOrCreateReferralCode({ full_name, email }) {
  const normalizedEmail = email.toLowerCase();

  const { data: existing } = await supabaseAdmin
    .from('referral_codes')
    .select('code, owner_name')
    .eq('owner_email', normalizedEmail)
    .single();

  if (existing) return existing.code;

  // Try a few times in case of a rare code collision
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = randomCode();
    const { error } = await supabaseAdmin
      .from('referral_codes')
      .insert({ code, owner_name: full_name, owner_email: normalizedEmail });

    if (!error) return code;
    // If it failed because the email already has a code (race condition), just fetch it
    if (error.code === '23505' && error.message.includes('owner_email')) {
      const { data: raced } = await supabaseAdmin
        .from('referral_codes')
        .select('code')
        .eq('owner_email', normalizedEmail)
        .single();
      if (raced) return raced.code;
    }
    // otherwise it was a code collision — loop and try a new random code
  }

  throw new Error('Could not generate a unique referral code after several attempts.');
}

/**
 * Records a qualifying referral event, if the code is real, the referred
 * person hasn't already been counted for this code, and they're not
 * referring themselves.
 */
export async function recordReferralEvent({ code, referredEmail, eventType, jobId = null }) {
  if (!code) return { recorded: false, reason: 'no_code' };

  const normalizedReferred = referredEmail.toLowerCase();

  const { data: owner } = await supabaseAdmin
    .from('referral_codes')
    .select('owner_email')
    .eq('code', code)
    .single();

  if (!owner) return { recorded: false, reason: 'invalid_code' };
  if (owner.owner_email === normalizedReferred) return { recorded: false, reason: 'self_referral' };

  const { error } = await supabaseAdmin.from('referral_events').insert({
    referral_code: code,
    referred_email: normalizedReferred,
    event_type: eventType,
    related_job_id: jobId,
  });

  // A unique-constraint error just means this person was already counted — not a real failure
  if (error && error.code !== '23505') {
    console.error('Referral event insert failed:', error.message);
    return { recorded: false, reason: 'error' };
  }

  return { recorded: !error, reason: error ? 'already_counted' : 'ok' };
}

/** Computes the reward tier someone has reached based on their qualifying referral count. */
export function referralTier(count) {
  if (count >= 15) return { tier: 300, next: null, remaining: 0 };
  if (count >= 5) return { tier: 80, next: 300, remaining: 15 - count };
  return { tier: 0, next: 80, remaining: 5 - count };
}
