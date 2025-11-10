import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
const supa = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST(req: Request) {
  try {
    const { email, password, name, role = 'editor', disabled = false } = await req.json();

    // Bootstrap: if no profiles, this becomes admin
    const admin = supa();
    const { count, error: pe } = await admin.from('profiles').select('id', { count: 'exact', head: true });
    if (pe) throw pe;
    const isBootstrap = count === 0;

    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: { role: isBootstrap ? 'admin' : String(role).toLowerCase() },
      user_metadata: { display_name: name },
      ban_duration: disabled ? '100y' : undefined,
    });
    if (error) throw error;

    // Create profile row - this should work with service role key + proper RLS policies
    const { error: upsertError } = await admin.from('profiles').upsert({
      id: data.user!.id,
      display_name: name,
      role: isBootstrap ? 'admin' : String(role).toLowerCase(),
      disabled: !!disabled,
    });
    
    if (upsertError) throw upsertError;

    return NextResponse.json({ uid: data.user!.id, email, role: isBootstrap ? 'admin' : role });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Server error' }, { status: 500 });
  }
}