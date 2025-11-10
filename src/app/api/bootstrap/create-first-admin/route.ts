import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json();
    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const supa = adminClient();

    // Check if any profiles exist
    const { count, error: countErr } = await supa
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    if (countErr) throw countErr;

    if ((count ?? 0) > 0) {
      return NextResponse.json({ error: 'Super Admin already exists' }, { status: 403 });
    }

    // Create first user as SUPER-ADMIN
    const { data, error } = await supa.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: { role: 'super-admin' },
      user_metadata: { display_name: name },
    });
    if (error) throw error;

    const user = data.user!;

    // Use upsert instead of insert to handle any race conditions
    const { error: profileError } = await supa.from('profiles').upsert({
      id: user.id,
      display_name: name,
      role: 'super-admin',
      disabled: false,
    });

    if (profileError) throw profileError;

    return NextResponse.json({ ok: true, uid: user.id });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Server error' }, { status: 500 });
  }
}