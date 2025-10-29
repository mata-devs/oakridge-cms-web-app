import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // service role
  );
}

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json();
    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const supa = adminClient();

    const { count, error: countErr } = await supa
      .from('users')
      .select('id', { count: 'exact', head: true });
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
    const { error: pe } = await supa.from('users').insert({
      id: user.id,
      email: user.email,
      display_name: name,
      role: 'super-admin',
      disabled: false,
    });
    if (pe) throw pe;

    return NextResponse.json({ ok: true, uid: user.id });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}
