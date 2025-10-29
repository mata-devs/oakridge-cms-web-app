import { NextResponse } from 'next/server';
import { createSupabaseServerAnon } from '../../../../lib/supabase/anon-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const hotspot = url.searchParams.get('hotspot');

  const supabase = createSupabaseServerAnon();

  const { data: userCheck } = await supabase.auth.getUser();
  const { data: who } = await supabase.rpc('whoami');
  console.log('whoami =>', who);
  console.log('GET /api/events as anon, user?', userCheck?.user);

  let query = supabase
    .from('events_with_status')
    .select('*')
    .eq('computed_status', 'live')
    .order('order', { ascending: true })
    .order('publish_at', { ascending: false, nullsFirst: true });

  // ✅ Filter by hotspot_group if provided
  if (hotspot) {
    query = query.eq('hotspot_group', hotspot);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    isAnon: !userCheck?.user,
    items: data,
  });
}
