export async function POST(request) {
  try {
    const { passcode } = await request.json();
    const ok = Boolean(passcode) && passcode === process.env.ADMIN_PASSCODE;
    return Response.json({ ok });
  } catch (err) {
    return Response.json({ ok: false }, { status: 400 });
  }
}
