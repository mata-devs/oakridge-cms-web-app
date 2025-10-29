/* eslint-disable @next/next/no-img-element */
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from "@/app/providers/UserProviders";
import { Hotspots, UpdateDraft } from '@/app/components/helpersAndInputs';
import SnackbarComponent, {SnackbarSettings} from '@/app/components/Snackbar';
// import { LabeledDate } from '@/app/components/helpersAndInputs';

type Props = {
  /** Optional: pass hotspot if you already have it */
  initial?: UpdateDraft;
  /** Optional: pass id if you want to skip reading from search params */
  hotspotId?: string;
  /** Optional callbacks */
  onSaved?: (h: Hotspots) => void;
  onCancel?: () => void;
  onChange?: (h: UpdateDraft) => void;
};

export default function UpdateHotspotPage({ initial, hotspotId, onSaved, onCancel, onChange }: Props) {
  const router = useRouter();
  const search = useSearchParams();
  const idFromQuery = search.get('id') || undefined;
  const id = hotspotId ?? initial?.id ?? idFromQuery;

  const { profile } = useUser();

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snackbarSettings, setSnackbarSettings] = useState<SnackbarSettings>({
        open: false,
        message: '',
        severity: '',
      });

  const [draft, setDraft] = useState<UpdateDraft>(
    initial ?? {
      id: '',
      name: '',
      description: '',
      image_url: null,
      level: '',
      startdate: '',
      enddate: '',
      starttime: '',
      endtime: '',
      title: '',
      cta_label: '',
      cta_href: '',
    }
  );

  const [file, setFile] = useState<File | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (initial) {
      setDraft(initial)
      setCurrentImageUrl(initial.image_url);
    };
  }, [initial]);

  useEffect(() => {
    console.log('🔄 Rerender:', { file, currentImageUrl });
  }, [file, currentImageUrl]);


  function updateField<K extends keyof UpdateDraft>(key: K, value: UpdateDraft[K]) {
    const updated = { ...draft, [key]: value };
    setDraft(updated);
    onChange?.(updated);
  }

  // fetch if no initial but have id
  useEffect(() => {
    if (initial || !id) return;
    (async () => {
      try {
        setBusy(true);
        setError(null);
        const res = await fetch('/api/hotspots?limit=1000', { cache: 'no-store' });
        const data: unknown = await res.json();
        if (!res.ok) throw new Error((data as { error?: string })?.error || 'Failed to load hotspot');
        const items = (data as { items?: Hotspots[] })?.items ?? [];
        const one = items.find(h => h.id === id);
        if (!one) throw new Error('Hotspot not found');

        const fetched: UpdateDraft = {
          id: one.id,
          name: one.name ?? '',
          description: one.description ?? '',
          image_url: one.image_url ?? '',
          level: one.level ?? '',
          startdate: one.startdate ?? '',
          enddate: one.enddate ?? '',
          starttime: one.starttime ?? '',
          endtime: one.endtime ?? '',
          title: one.title ?? '',
          cta_label: one.cta_label ?? '',
          cta_href: one.cta_href ?? ''
        };
        setDraft(fetched);
        setCurrentImageUrl(one.image_url ?? null);
        onChange?.(fetched);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load hotspot');
      } finally {
        setBusy(false);
      }
    })();
  }, [id, initial, onChange]);

  const previewUrl = useMemo(() => {
    if (file) return URL.createObjectURL(file);
    return currentImageUrl;
  }, [file, currentImageUrl]);

  useEffect(() => {
    return () => {
      if (file && previewUrl && previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    };
  }, [file, previewUrl]);

  function onPickFile() {
    fileInputRef.current?.click();
  }

  console.log('file', file)
  function onFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }
    setError(null);
    setFile(f);

    const url = URL.createObjectURL(f);
    setCurrentImageUrl(url);

    setDraft((prev)=>({
      ...prev,
      image_url: currentImageUrl,
    }))
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }
    setError(null);
    setFile(f);

    const url = URL.createObjectURL(f);
    setCurrentImageUrl(url);
  }

  async function handleUpdate() {
    if (!id) {
      setError('Missing hotspot id.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('name', draft.name.trim());
      fd.append('description', draft.description?.trim() ?? '');
      fd.append('level', draft.level?.trim() ?? '');
      fd.append('startdate', draft.startdate ?? '');
      fd.append('enddate', draft.enddate ?? '');
      fd.append('starttime', draft.starttime ?? '');
      fd.append('endtime', draft.endtime ?? '');
      fd.append('title', draft.title ?? '');
      fd.append('cta_label', draft.cta_label ?? '');
      fd.append('cta_href', draft.cta_href ?? '');
      // console.log("file", file)
      if (file) {
        console.log("file", file)

        fd.append('file', file);
      }
      else if (!file && !currentImageUrl) {
        fd.append('clearImage', 'true');
      }

      console.log("fd", fd)
      const res = await fetch(`/api/admin/hotspots/${id}`, { method: 'PATCH', body: fd });
      const data: unknown = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSnackbarSettings((prev) => ({...prev,
                open: true,
                message: 'Update Failed',
                severity: 'error'
            }))
        throw new Error((data as { error?: string })?.error || 'Update failed')
      }
      console.log ({data})

      const updated = (data as { item?: Hotspots })?.item;
      if (updated) {
        setSnackbarSettings((prev) => ({...prev,
              open: true,
              message: 'Update Successful',
              severity: 'success'
          }))
        setCurrentImageUrl(updated.image_url ?? currentImageUrl);
      }

      try { router.refresh(); } catch { /* noop */ }
    } catch (e: unknown) {
      setSnackbarSettings((prev) => ({...prev,
                open: true,
                message: 'Update Failed',
                severity: 'error'
            }))
      setError(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setBusy(false);
    }
  }

  function handleCancel() {
    if (onCancel) onCancel();
    else router.back();
  }

  function clearDate(){
    setDraft((prev) => ({
      ...prev,
      startdate: '',
      enddate: '',
    }));
    onChange?.({
      ...draft,
      startdate: '',
      enddate: '',
    });
  }

  function clearImage(){
    setDraft((prev) => ({
      ...prev,
      image_url: '',
    }));

    setFile(null);

    setCurrentImageUrl(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    onChange?.({
      ...draft,
      image_url: '',
    });
  }

  function clearTime(){
    setDraft((prev) => ({
      ...prev,
      starttime: '',
      endtime: '',
    }));
    onChange?.({
      ...draft,
      starttime: '',
      endtime: '',
    });
  }

  return (
    <div className="mt-4 space-y-4 text-white">
      <div className={`grid grid-cols-1 gap-3 ${profile?.role === 'super-admin' && 'md:grid-cols-2'}`}>
        {profile?.role === 'super-admin' && (
          <>
          <label className="block">
            <div className="mb-1 text-sm text-white/80">Name</div>
            <input
              type="text"
              value={draft.name ?? ''}
              onChange={(e) => updateField("name", e.target.value)}
              className="w-full rounded-lg bg-[#131a2a] border border-white/10 px-3 py-2 outline-none focus:border-white/30"
              placeholder="e.g., Lobby"
              disabled={busy}
            />
          </label>
            <label className="block">
              <div className="mb-1 w-full text-sm text-white/80">Group</div>
              <select
                value={draft.level || ''}
                onChange={(e) => updateField("level", e.target.value)}
                disabled={busy}
                className="w-full rounded-lg bg-[#131a2a] border border-white/10 px-3 py-2 outline-none focus:border-white/30"
              >
                <option value="">Select Level</option>
                <option value="Ground Level">Ground Level</option>
                <option value="Second Level">Second Level</option>
                <option value="Third Level">Third Level</option>
                <option value="Fifth Level">Fifth Level</option>
                <option value="Sixth Level">Sixth Level</option>
                <option value="60th Level">60th Level</option>
                <option value="62nd Level">62nd Level</option>
                <option value="66th Level">66th Level</option>
              </select>
            </label>
          </>
        )}
      </div>
      <div className='w-full '>
        <label className="block">
          <div className="mb-1 w-full text-sm text-white/80">Title</div>
          <input
            type="text"
            value={draft.title ?? ''}
            onChange={(e) => updateField("title", e.target.value)}
            className="w-full rounded-lg bg-[#131a2a] border border-white/10 px-3 py-2 outline-none focus:border-white/30"
            placeholder="e.g., Lobby"
            disabled={busy}
          />
        </label>
      </div>

      <div className='w-full flex flex-col'>
        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <div className="text-sm mb-1 text-white/80">Start date</div>
            <input style={{ colorScheme: 'dark' }} type="date" value={draft.startdate || ''} onChange={(e) => updateField("startdate", e.target.value)} className="w-full rounded-lg bg-[#131a2a] border border-white/10 px-3 py-2 outline-none focus:border-white/30" />
          </label>
          <label className="block">
            <div className="text-sm mb-1 text-white/80">End date</div>
            <input style={{ colorScheme: 'dark' }} type="date" value={draft.enddate || ''} onChange={(e) => updateField("enddate", e.target.value)} className="w-full rounded-lg bg-[#131a2a] border border-white/10 px-3 py-2 outline-none focus:border-white/30" />
          </label>
          {/* <LabeledDate label="End date" value={enddate} onChange={setEnddate} min={startdate || undefined} /> */}
        </div>
        <span
          onClick={()=>clearDate()}
          className='w-full text-white/20 cursor-pointer hover:text-white/50 text-end px-2'>
          clear
        </span>
      </div>

      <div className='w-full flex flex-col'>
        <div className="grid grid-cols-2 mt-1 gap-2">
          <label className="block">
            <div className="text-sm mb-1 text-white/80">
              Start time
            </div>
            <input
              style={{ colorScheme: 'dark' }}
              type="time"
              value={draft.starttime || ''}
              onChange={(e) => updateField("starttime",e.target.value)}
              className="w-full rounded-lg bg-[#131a2a] border border-white/10 px-3 py-2 outline-none focus:border-white/30"
            />
          </label>
          <label className="block">
            <div className="text-sm mb-1 text-white/80">
              End time
            </div>
            <input
              style={{ colorScheme: 'dark' }}
              type="time"
              value={draft.endtime || ''}
              onChange={(e) => updateField("endtime",e.target.value)}
              className="w-full rounded-lg bg-[#131a2a] border border-white/10 px-3 py-2 outline-none focus:border-white/30"
            />
          </label>
        </div>
        <span 
          onClick={()=>clearTime()}
          className='w-full text-white/20 cursor-pointer hover:text-white/50 text-end px-2'>
          clear
        </span>
      </div>

      <label className="block">
        <div className="mb-1 text-sm text-white/80">Description</div>
        <textarea
          value={draft.description ?? ''}
          onChange={(e) => updateField("description", e.target.value)}
          rows={3}
          className="w-full rounded-lg bg-[#131a2a] border border-white/10 px-3 py-2 outline-none focus:border-white/30"
          placeholder="Optional details…"
          disabled={busy}
        />
      </label>
      <div className='grid grid-cols-2 mt-1 gap-2'>
        <label className="block">
          <div className="text-sm mb-1 text-white/80">CTA Label</div>
          <input value={draft.cta_label || ''} onChange={(e)=>{updateField("cta_label", e.target.value)}} placeholder="Learn More" className="w-full rounded-lg bg-[#131a2a] border border-white/10 px-3 py-2 outline-none focus:border-white/30" />
        </label>
        <label className="block">
          <div className="text-sm mb-1 text-white/80">CTA Link</div>
          <input value={draft.cta_href || ''} onChange={(e)=>{updateField("cta_href", e.target.value)}} placeholder="https://example.com" className="w-full rounded-lg bg-[#131a2a] border border-white/10 px-3 py-2 outline-none focus:border-white/30" />
        </label>
      </div>

      <div
        className="rounded-xl border border-dashed border-white/15 bg-[#131a2a] p-3"
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm text-white/80">Hotspot image (optional)</div>
            <div className="text-xs text-white/50">PNG / JPG / WEBP / GIF</div>
          </div>
          <div>
            <span
              onClick={()=>clearImage()}
              className='text-white/20 cursor-pointer hover:text-white/50 px-2'>
              clear
            </span>
          </div>
        </div>

        <div className="mt-3 flex gap-3">
          <button
            type="button"
            onClick={onPickFile}
            disabled={busy}
            className="rounded-md bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20 disabled:opacity-50"
          >
            Browse…
          </button>
          {currentImageUrl && !file ? (
            <span className="text-xs text-white/60 truncate">Current: {currentImageUrl}</span>
          ) : null}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={onFileSelect}
          className="hidden"
        />

        {previewUrl ? (
          <div className="mt-3 relative aspect-video w-full overflow-hidden rounded-lg">
            <img
              src={previewUrl}
              alt="Preview"
              className="h-full w-full object-contain bg-black/20"
            />
          </div>
        ) : (
          <div className="mt-3 flex h-28 items-center justify-center rounded-lg bg-black/20 text-xs text-white/50">
            No image selected
          </div>
        )}
      </div>

      {error && <div className="text-xs text-red-300">{error}</div>}

      <div className="mt-2 flex justify-end gap-2">
        <button
          type="button"
          onClick={handleCancel}
          disabled={busy}
          className="rounded-lg px-3 py-2 text-sm bg-white/10 hover:bg-white/20 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleUpdate}
          disabled={busy || !id}
          className="rounded-lg px-3 py-2 text-sm font-medium text-black bg-green-400 hover:bg-green-500 disabled:opacity-50"
        >
          {busy ? 'Saving…' : 'Update'}
        </button>
      </div>
      <SnackbarComponent snackbarSettings={snackbarSettings} setSnackbarSettings={setSnackbarSettings}/>
    </div>
  );
}
