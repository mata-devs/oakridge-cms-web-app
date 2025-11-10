// app/api/admin/users/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createSupabaseServer } from '../../../../../lib/supabase/server'; // your session-bound server client

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // server-only
  );
}

export async function GET(req: Request) {
  try {
    // 1) Who is calling?
    const supaServer = await createSupabaseServer();
    const { data: { user } } = await supaServer.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // 2) Caller role from users (trusted source)
    const { data: me, error: meErr } = await supaServer
      .from('profiles')
      .select('role, disabled')
      .eq('id', user.id)
      .single();
    if (meErr) throw meErr;
    if (!me || me.disabled) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const callerRole = me.role as 'super-admin' | 'admin' | 'editor' | 'user';

    // Only staff can view this page at all (adjust as you like)
    if (!['super-admin','admin'].includes(callerRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Optional pagination
    const url = new URL(req.url);
    const page = Number(url.searchParams.get('page') ?? 1);
    const perPage = Number(url.searchParams.get('perPage') ?? 100);

    // 3) Admin API to list auth users (needs service key)
    const supaAdmin = adminClient();
    const { data, error } = await supaAdmin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    // 4) Join with users to get roles/flags from DB
    const ids = data.users.map(u => u.id);
    const { data: users, error: pErr } = await supaAdmin
      .from('profiles')
      .select('id, display_name, role, disabled, created_at')
      .in('id', ids);
    if (pErr) throw pErr;

    const profileById = new Map(users.map(p => [p.id, p]));

    // 5) Map and filter: admins cannot see super-admins
    const items = data.users
      .map(u => {
        const p = profileById.get(u.id);
        const role = (p?.role ??
          ((u.app_metadata as any)?.role as string | undefined) ??
          'user') as 'super-admin' | 'admin' | 'editor' | 'user';

        return {
          uid: u.id,
          email: u.email!,
          displayName: p?.display_name ?? (u.user_metadata as any)?.display_name ?? '',
          role,
          disabled: !!p?.disabled || !!u.banned_until,
          createdAt: u.created_at ? new Date(u.created_at).getTime() : undefined,
          lastLoginAt: u.last_sign_in_at ? new Date(u.last_sign_in_at).getTime() : undefined,
        };
      })
      .filter(row => {
        if (callerRole === 'super-admin') return true;           // can see all
        // caller is 'admin' → hide super-admins
        return row.role !== 'super-admin';
      });

    return NextResponse.json({ items, page, perPage, total: data.users.length });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}
