import { supabaseAdmin, isSupabaseConfigured } from '../../../lib/supabaseAdmin';
import { referralTier } from '../../../lib/referral';

export async function POST(request) {
  if (!isSupabaseConfigured) {
    return Response.json({ error: 'The site is not fully set up yet.' }, { status: 503 });
  }

  try {
    const { email } = await request.json();
    const normalizedEmail = email?.toString().trim().toLowerCase();

    if (!normalizedEmail) {
      return Response.json({ error: 'Email is required.' }, { status: 400 });
    }

    const { data: codeRow } = await supabaseAdmin
      .from('referral_codes')
      .select('code')
      .eq('owner_email', normalizedEmail)
      .single();

    if (!codeRow) {
      return Response.json({
        found: false,
        message: "No referral code found yet — apply to a job first to get your unique link.",
      });
    }

    const { count } = await supabaseAdmin
      .from('referral_events')
      .select('id', { count: 'exact', head: true })
      .eq('referral_code', codeRow.code);

    const referralCount = count || 0;
    const { tier, next, remaining } = referralTier(referralCount);

    return Response.json({
      found: true,
      code: codeRow.code,
      count: referralCount,
      tier,
      next,
      remaining,
    });
  } catch (err) {
    console.error('Referral-status route error:', err);
    return Response.json({ error: 'Unexpected error. Please try again.' }, { status: 500 });
  }
}
