import { NextResponse } from 'next/server';
import { createSupabaseServer } from '../../../../../lib/supabase/server';
import { randomUUID } from 'crypto';

export async function GET() {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from('hotspots')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServer();
    const formData = await req.formData();

    const name = formData.get('name') as string;
    const title = formData.get('title') as string;
    const file = formData.get('hotspot_logo') as File | null;

    if (!name || !title) {
      return NextResponse.json({ error: 'Name and title are required' }, { status: 400 });
    }

    let publicUrl: string | null = null;

    if (file && file.size > 0) {
      // Convert File to Buffer for Supabase upload
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${randomUUID()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('hotspot_logos')
        .upload(fileName, buffer, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type || 'image/jpeg',
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return NextResponse.json({ error: uploadError.message }, { status: 500 });
      }

      const { data: publicData } = supabase.storage
        .from('hotspot_logos')
        .getPublicUrl(fileName);

      publicUrl = publicData.publicUrl;
    }

    const { data, error } = await supabase
      .from('hotspots')
      .insert({
        name,
        title,
        hotspot_logo: publicUrl,
      })
      .select()
      .single();

    if (error) {
      console.error('Database insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const supabase = await createSupabaseServer();
    const formData = await req.formData();

    const id = formData.get('id') as string;
    const name = formData.get('name') as string;
    const title = formData.get('title') as string;
    const file = formData.get('hotspot_logo') as File | null;

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = { 
      name, 
      title 
    };

    // ✅ optional logo update
    if (file && file.size > 0) {
      // Convert File to Buffer for Supabase upload
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${randomUUID()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('hotspot_logos')
        .upload(fileName, buffer, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type || 'image/jpeg',
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return NextResponse.json({ error: uploadError.message }, { status: 500 });
      }

      const { data: publicData } = supabase.storage
        .from('hotspot_logos')
        .getPublicUrl(fileName);

      updateData.hotspot_logo = publicData.publicUrl;
    }

    const { data, error } = await supabase
      .from('hotspots')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Database update error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const supabase = await createSupabaseServer();
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    const { error } = await supabase.from('hotspots').delete().eq('id', id);
    if (error) {
      console.error('Delete error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}