import { supabaseAdmin, isSupabaseConfigured } from '../../../lib/supabaseAdmin';

export async function POST(request) {
  if (!isSupabaseConfigured) {
    return Response.json(
      { error: 'The site is not fully set up yet — the database keys are missing. Contact the site owner.' },
      { status: 503 }
    );
  }

  try {
    const formData = await request.formData();

    const full_name = formData.get('full_name')?.toString().trim();
    const email = formData.get('email')?.toString().trim().toLowerCase();
    const phone = formData.get('phone')?.toString().trim() || null;
    const role_interest = formData.get('role_interest')?.toString().trim();
    const location = formData.get('location')?.toString().trim() || null;
    const experience_level = formData.get('experience_level')?.toString().trim() || null;
    const cvFile = formData.get('cv'); // optional File

    if (!full_name || !email || !role_interest) {
      return Response.json(
        { error: 'Name, email, and the role you want alerts for are required.' },
        { status: 400 }
      );
    }

    let cv_url = null;

    // If they attached a CV, upload it to Supabase Storage (bucket: "cvs")
    if (cvFile && typeof cvFile === 'object' && cvFile.size > 0) {
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ];
      if (!allowedTypes.includes(cvFile.type)) {
        return Response.json(
          { error: 'CV must be a PDF or Word document.' },
          { status: 400 }
        );
      }
      if (cvFile.size > 5 * 1024 * 1024) {
        return Response.json({ error: 'CV must be under 5MB.' }, { status: 400 });
      }

      const bytes = await cvFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const safeName = `${Date.now()}-${cvFile.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`;
      const path = `${email}/${safeName}`;

      const { error: uploadError } = await supabaseAdmin.storage
        .from('cvs')
        .upload(path, buffer, { contentType: cvFile.type, upsert: true });

      if (uploadError) {
        console.error('CV upload failed:', uploadError.message);
        return Response.json({ error: 'Could not upload your CV. Try again.' }, { status: 500 });
      }

      const { data: signed } = await supabaseAdmin.storage
        .from('cvs')
        .createSignedUrl(path, 60 * 60 * 24 * 365); // valid 1 year
      cv_url = signed?.signedUrl || null;
    }

    // Insert or update (in case they sign up again with a new CV/role)
    const { error: dbError } = await supabaseAdmin
      .from('subscribers')
      .upsert(
        {
          full_name,
          email,
          phone,
          role_interest,
          location,
          experience_level,
          cv_url,
          subscribed: true,
        },
        { onConflict: 'email' }
      );

    if (dbError) {
      console.error('Signup insert failed:', dbError.message);
      return Response.json({ error: 'Something went wrong saving your details.' }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error('Signup route error:', err);
    return Response.json({ error: 'Unexpected error. Please try again.' }, { status: 500 });
  }
}
