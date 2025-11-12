import { NextResponse } from 'next/server';
import { createSupabaseServerAnon } from '../../../../lib/supabase/anon-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const supabase = createSupabaseServerAnon();
    const url = new URL(req.url);

    const name = url.searchParams.get('name');
    const limit = Math.min(Number(url.searchParams.get('limit') || 50), 200);
    const offset = Math.max(Number(url.searchParams.get('offset') || 0), 0);

    // If name is provided, return hotspots that match the name
    if (name) {
      const { data, error } = await supabase
        .from('hotspots')
        .select('*')
        .ilike('name', `%${name}%`); // Case-insensitive partial match

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json(data || []);
    }

    // If no name, return all hotspots with pagination
    let q = supabase
      .from('hotspots')
      .select('*', { count: 'exact' });

    // Sort by creation date (newest first) by default
    q = q.order('created_at', { ascending: false });

    // Apply pagination
    const from = offset;
    const to = offset + limit - 1;

    const { data, error, count } = await q.range(from, to);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      items: data ?? [],
      count: count ?? 0,
      limit,
      offset,
    });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Server error' },
      { status: 500 }
    );
  }
}