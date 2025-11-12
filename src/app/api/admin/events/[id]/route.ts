import { NextResponse } from 'next/server';
import { createSupabaseServer } from '../../../../../../lib/supabase/server';

export const runtime = 'nodejs';
type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, {params}: Ctx) {
  const { id } = await params;
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from('events_with_status')
    .select('*')
    .eq('id', id)
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json({ item: data });
}

export async function PATCH(req: Request, {params}: Ctx) {
  const { id } = await params;
  const supabase = await createSupabaseServer();
  const body = await req.json();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const update = {
    title: body.title ?? undefined,
    subheading: body.subheading ?? undefined,
    category: body.category ?? undefined,
    description: body.description ?? undefined,
    start_date: body.startDate ?? undefined,
    end_date: body.endDate ?? undefined,
    start_time: body.startTime ?? undefined,
    end_time: body.endTime ?? undefined,
    cta_label: body.ctaLabel ?? undefined,
    cta_href: body.ctaHref ?? undefined,
    image_url: body.image_url ?? undefined,
    published: typeof body.published === 'boolean' ? body.published : undefined,
    publish_at: body.publishAt === undefined ? undefined : body.publishAt,
    unpublish_at: body.unpublishAt === undefined ? undefined : body.unpublishAt,
    order: typeof body.order === 'number' ? body.order : undefined,
    hotspot_group: body.hotspot_group ?? undefined
  } as const;

  const { data, error } = await supabase
    .from('events')
    .update(update)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: data });
}


export async function DELETE(
  _req: Request,
  {params}: Ctx
) {
  const { id } = await params;
  const supabase = await createSupabaseServer();

  const { data: ev, error: readErr } = await supabase
    .from('events')
    .select('image_url')
    .eq('id', id)
    .single();

  if (readErr) return NextResponse.json({ error: readErr.message }, { status: 404 });

  const { error } = await supabase.from('events').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const path = toStoragePath(
    ev?.image_url,
    'events'
  );
  if (path) {
    try {
      await supabase.storage.from('events').remove([path]);
    } catch {
      // ignore; keep delete successful even if storage remove fails
    }
  }

  return NextResponse.json({ ok: true });
}

export function toStoragePath(
  urlOrPath?: string | null,
  bucket = 'events'
): string | null {
  if (!urlOrPath) return null;

  if (!/^https?:\/\//i.test(urlOrPath)) {
    const noBucket = urlOrPath.replace(new RegExp(`^${bucket}/`), '');
    return noBucket || null;
  }

  try {
    const u = new URL(urlOrPath);
    const m = u.pathname.match(
      new RegExp(`/object/(?:public|sign)/${bucket}/(.+)$`)
    );
    if (m && m[1]) return m[1];
  } catch {
    // ignore parsing errors
  }
  return null;
}

export function ensureUtcIso(v?: string | null) {
  if (!v) return null;
  if (/[zZ]$/.test(v) || /[+\-]\d\d:\d\d$/.test(v)) return v;
  return new Date(v).toISOString();
}