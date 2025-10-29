import { NextResponse } from 'next/server';
import { createSupabaseServer } from '../../../../../lib/supabase/server';

export async function GET() {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase.from('hotspots').select('*').order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const supabase = await createSupabaseServer();
  const { name, title } = await req.json();

  if (!name || !title)
    return NextResponse.json({ error: 'Name and title are required' }, { status: 400 });

  const { data, error } = await supabase.from('hotspots').insert({ name, title }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

export async function PUT(req: Request) {
  const supabase = await createSupabaseServer();
  const { id, name, title } = await req.json();

  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

  const { data, error } = await supabase
    .from('hotspots')
    .update({ name, title })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: Request) {
  const supabase = await createSupabaseServer();
  const { id } = await req.json();

  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

  const { error } = await supabase.from('hotspots').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
