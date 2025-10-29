import { NextResponse } from 'next/server';
import { createSupabaseServer } from '../../../../../lib/supabase/server';

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


// export async function POST(req: Request) {
//   const supabase = await createSupabaseServer();
//   const body = await req.json();
//   const { data: { user } } = await supabase.auth.getUser();
//   if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

//   const payload = {
//     title: body.title, subheading: body.subheading, description: body.description,
//     start_date: body.startDate || null,
//     end_date: body.endDate || null,
//     start_time: body.startTime || null,
//     end_time: body.endTime || null,
//     cta_label: body.ctaLabel,
//     cta_href: body.ctaHref,
//     image_url: body.image_url || null,
//     image_path: body.image_path || null,
//     status: body.status || 'draft',
//     order: body.order ?? 0,
//     updated_by: user.id
//   };

//   const { data, error } = await supabase.from('events').insert(payload).select().single();
//   if (error) return NextResponse.json({ error: error.message }, { status: 500 });
//   return NextResponse.json({ item: data });
// }

export async function POST(req: Request) {
  const supabase = await createSupabaseServer();
  const body = await req.json();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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
    updated_by: user.id,
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
