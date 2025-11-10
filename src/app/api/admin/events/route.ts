import { NextResponse } from 'next/server';
import { createSupabaseServer } from '../../../../../lib/supabase/server';
import { createSupabaseAdmin } from '../../../../../lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const supabase = await createSupabaseServer();

  const { data, error } = await supabase
    .from('events_with_status')
    .select('*')
    .order('order', { ascending: true })
    .order('publish_at', { ascending: false, nullsFirst: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data });
}

export async function POST(req: Request) {
  const supabase = await createSupabaseAdmin();
  const body = await req.json();

  // console.time("getUser")
  // const { data: { user }, error: authError } = await supabase.auth.getUser()
  // console.timeEnd("getUser")
  // console.log({ user, authError })

  // if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const payload = {
    title: body.title ?? null,
    subheading: body.subheading ?? null,
    description: body.description ?? null,
    start_date: body.startDate ?? null,
    end_date: body.endDate ?? null,
    start_time: body.startTime ?? null,
    end_time: body.endTime ?? null,
    cta_label: body.ctaLabel ?? null,
    cta_href: body.ctaHref ?? null,
    image_url: body.image_url ?? null,
    published: Boolean(body.published ?? false),
    publish_at: body.publishAt ?? null,
    unpublish_at: body.unpublishAt ?? null,
    order: body.order ?? 0,
    updated_by: null,
    hotspot_group: body.hotspot_group ?? null
  };

  const { data, error } = await supabase
    .from('events')
    .insert(payload)
    .select()
    .single();
  console.log({ payload, data, error });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: data });
}
