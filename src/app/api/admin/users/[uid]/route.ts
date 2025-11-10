import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
const admin = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);


type Role = 'super-admin' | 'admin' | 'editor' | 'user';
const ROLES: Role[] = ['super-admin', 'admin', 'editor', 'user'];

type Ctx = { params: Promise<{ uid: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const { uid } = await ctx.params;
    const body = await req.json();

    // ---- validate inputs
    const nextRole: Role | undefined = typeof body.role === 'string'
      ? (String(body.role).toLowerCase() as Role)
      : undefined;
    if (nextRole && !ROLES.includes(nextRole)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // ---- 1) Update Auth user (Admin API)
    const attrs: any = {};
    if (typeof body.displayName === 'string') {
      attrs.user_metadata = { ...(attrs.user_metadata ?? {}), display_name: body.displayName };
    }
    if (nextRole) {
      attrs.app_metadata = { ...(attrs.app_metadata ?? {}), role: nextRole };
    }
    if (typeof body.password === 'string' && body.password.length >= 8) {
      attrs.password = body.password;
    }
    if (typeof body.disabled === 'boolean') {
      // Supabase expects 'none' to unban
      attrs.ban_duration = body.disabled ? '100y' : 'none';
    }

    if (Object.keys(attrs).length > 0) {
      const { error: uErr } = await admin().auth.admin.updateUserById(uid, attrs);
      if (uErr) throw uErr;
    }

    // ---- 2) Mirror to profiles (source of truth for UI/permissions)
    const prof: any = {};
    if (typeof body.displayName === 'string') prof.display_name = body.displayName;
    if (nextRole) prof.role = nextRole;
    if (typeof body.disabled === 'boolean') prof.disabled = body.disabled;

    let updatedProfile = null;
    if (Object.keys(prof).length > 1) {
      const { data: p, error: pErr } = await admin()
        .from('profiles')
        .update(prof)
        .eq('id', uid)
        .select('id, display_name, role, disabled')
        .maybeSingle();
      if (pErr) throw pErr;
      updatedProfile = p;
    }

    // ---- 3) Fetch fresh Auth user so caller sees what was saved
    const { data: freshUser, error: gErr } = await admin().auth.admin.getUserById(uid);
    if (gErr) throw gErr;

    return NextResponse.json({
      ok: true,
      uid,
      profile: updatedProfile,
      auth: {
        email: freshUser.user?.email,
        app_metadata: freshUser.user?.app_metadata,
        user_metadata: freshUser.user?.user_metadata,
        banned_until: freshUser.user?.banned_until,
      },
      note:
        'If this user is currently signed in, they must sign out/in (or refresh session) to receive the new role in their JWT.',
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    const { uid } = await ctx.params;
    const { error } = await admin().auth.admin.deleteUser(uid);
    if (error) throw error;
    await admin().from('profiles').delete().eq('id', uid);
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}
