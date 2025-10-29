import { supabase } from '../supabase/client';
import { v4 as uuidv4 } from 'uuid';

export async function uploadEventImage(file: File, opts?: { oldPath?: string }) {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const key = `${uuidv4()}.${ext}`;

  const path = `oakridge/${key}`;

  const { error: upErr } = await supabase
    .storage.from('oakridge')
    .upload(path, file, { contentType: file.type, upsert: false });
  if (upErr) throw upErr;
 
  const { data: pub } = supabase.storage.from('oakridge').getPublicUrl(path);

  if (opts?.oldPath) {
    await supabase.storage.from('oakridge').remove([opts.oldPath]).catch(() => {});
  }

  return { path, publicUrl: pub?.publicUrl ?? null };
}
