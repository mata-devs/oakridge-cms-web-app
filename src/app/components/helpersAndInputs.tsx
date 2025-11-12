'use client';
import React, { useState } from 'react';
interface ImageDropzoneProps {
  imageUrl?: string | null;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onPickClick: () => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

export type EventType = {
  id: string;
  title?: string;
  subheading?: string;
  category?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  start_time?: string;
  end_time?: string;
  cta_label?: string;
  cta_href?: string;
  image_url?: string;
  image_path?: string;
  order?: number;
  published?: boolean;
  publish_at?: string | null;
  unpublish_at?: string | null;
  computed_status?: 'hidden' | 'scheduled' | 'expired' | 'live';
  hotspot_group?: string;
  [key: string]: unknown;
};

export const ImageDropzone: React.FC<ImageDropzoneProps> = ({
  imageUrl,
  onFileSelect,
  onDrop,
  onDragOver,
  onPickClick,
  inputRef
}) => {
  return (
    <div
      className="border border-dashed rounded-xl h-32 flex items-center justify-center relative hover:border-white/60 transition-colors cursor-pointer group"
      onClick={onPickClick}
      onDrop={onDrop}
      onDragOver={onDragOver}
      title="Click, drag & drop, or paste an image"
    >
      {!imageUrl ? (
        <div className="text-center text-white/70 px-4">
          <div className="text-sm">Image Upload</div>
          <div className="text-xs mt-1 opacity-80">Click, drag & drop, or paste</div>
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt="Preview"
          className="absolute inset-0 w-full h-full object-cover rounded-xl"
        />
      )}
      <div className="absolute inset-0 rounded-xl ring-0 group-hover:ring-2 ring-white/10 pointer-events-none" />
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={onFileSelect}
        className="hidden"
      />
    </div>
  );
};

// export async function fetchEventsForClient({ setEvents, setLoadingEvents }: { setEvents: (events: EventType[]) => void; setLoadingEvents: (loading: boolean) => void; }) {
//   setLoadingEvents(true);
//   try {
//     const res = await fetch('/api/events', { cache: 'no-store' });
//     const data = await res.json();
//     console.log(data, 'fetched data for homepage');
//     console.log(
//       'ANON key fingerprint:',
//       process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 6),
//       '…',
//       process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(-6)
//     );
//     if (!res.ok) throw new Error(data?.error || 'Failed to load events');
//     const items = (data.items || []).sort(
//     (a: EventType, b: EventType) => (a.order ?? 0) - (b.order ?? 0)
//   );
//     // console.log(items, 'fetched items for homepage');
//     setEvents(items);
//   } catch (e) {
//     console.error(e);
//   } finally {
//     setLoadingEvents(false);
//   }
// }

export async function fetchEventsForClient({
  setEvents,
  setLoadingEvents,
  hotspotGroup,
}: {
  setEvents: (events: EventType[]) => void;
  setLoadingEvents: (loading: boolean) => void;
  hotspotGroup?: string;
}) {
  setLoadingEvents(true);

  try {
    const url = hotspotGroup
      ? `/api/events?hotspot=${encodeURIComponent(hotspotGroup)}`
      : `/api/events`;

    const res = await fetch(url, { cache: 'no-store' });
    const data = await res.json();

    console.log(
      data,
      hotspotGroup
        ? `Fetched events for hotspot: ${hotspotGroup}`
        : 'Fetched all events for homepage'
    );

    console.log(
      'ANON key fingerprint:',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 6),
      '…',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(-6)
    );

    if (!res.ok) throw new Error(data?.error || 'Failed to load events');

    const items = (data.items || []).sort(
      (a: EventType, b: EventType) => (a.order ?? 0) - (b.order ?? 0)
    );

    setEvents(items);
  } catch (e) {
    console.error('Error fetching events:', e);
  } finally {
    setLoadingEvents(false);
  }
}


export async function fetchEventsForAdmin({ setEvents, setLoadingEvents }: { setEvents: (events: EventType[]) => void; setLoadingEvents: (loading: boolean) => void; }) {
  setLoadingEvents(true);
  try {
    const res = await fetch('/api/admin/events', { cache: 'no-store' });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || 'Failed to load events');
    const items = (data.items || []).sort(
    (a: EventType, b: EventType) => (a.order ?? 0) - (b.order ?? 0)
  );

    setEvents(items);
  } catch (e) {
    console.error(e);
  } finally {
    setLoadingEvents(false);
  }
}

export type Season = {
  id: string;
  name: string;
  image_url: string | null;
  gif_url: string | null;
  is_active?: boolean;
  created_at?: string;
};

export async function fetchSeasons({setSeasons,setLoading,}: {setSeasons: (items: Season[]) => void; setLoading?: (loading: boolean) => void;}) {
  try {
    setLoading?.(true);
    const res = await fetch('/api/seasons', { cache: 'no-store' });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error || 'Failed to load seasons');
    const items: Season[] = Array.isArray(json?.items) ? json.items : [];
    setSeasons(items);
    return items;
  } catch (err) {
    console.error(err);
    setSeasons([]);
    return [];
  } finally {
    setLoading?.(false);
  }
}
export type Hotspots = {
  id: string;
  name: string;
  description?: string | null;
  image_url?: string | null;
  level?: string | null;
  startdate?: string | null;
  enddate?: string | null;
  starttime?: string | null;
  endtime?: string | null;
  title?: string | null;
  cta_label?: string | null;
  cta_href?: string | null;
}

export type UpdateDraft = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  level: string | null,
  startdate?: string | null;
  enddate?: string | null;
  starttime?: string | null;
  endtime?: string | null;
  title?: string | null;
  cta_label?: string | null;
  cta_href?: string | null;
}

export async function fetchHotspots({setHotspots, setLoading}:{setHotspots: (items: Hotspots[])=>void; setLoading?: (loading:boolean)=>void;}){
  try {
    setLoading?.(true);
    const res = await fetch('/api/hotspots', { cache: 'no-store' });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error || 'Failed to load seasons');
    const items: Hotspots[] = Array.isArray(json?.items) ? json.items : [];
    setHotspots(items);
    return items;
  } catch (err) {
    console.error(err);
    setHotspots([]);
    return [];
  } finally {
    setLoading?.(false);
  }
}

export function LabeledInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <div className="text-sm mb-1 text-white/80">{label}</div>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full rounded-lg bg-[#131a2a] border border-white/10 px-3 py-2 outline-none focus:border-white/30" />
    </label>
  );
}

export function LabeledTextarea({ label, value, onChange, placeholder, rows = 5 }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return (
    <label className="block">
      <div className="text-sm mb-1 text-white/80">{label}</div>
      <textarea value={value} maxLength={500} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows} className="w-full rounded-lg bg-[#131a2a] border border-white/10 px-3 py-2 outline-none focus:border-white/30 resize-y" />
    </label>
  );
}

export function LabeledDate({ label, value, onChange, min, max }: { label: string; value: string; onChange: (v: string) => void; min?: string; max?: string }) {
  return (
    <label className="block">
      <div className="text-sm mb-1 text-white/80">{label}</div>
      <input style={{ colorScheme: 'dark' }} type="date" value={value} min={min} max={max} onChange={(e) => onChange(e.target.value)} className="w-full rounded-lg bg-[#131a2a] border border-white/10 px-3 py-2 outline-none focus:border-white/30" />
    </label>
  );
}

export type Status = 'all'|'live' | 'scheduled' | 'expired' | 'hidden';
export const computeStatus = (e: EventType): Status => {
  if (e?.computed_status) return e.computed_status as Status;
  if (!e?.published) return 'hidden';
  const now = Date.now();
  const pub  = e?.publish_at   ? new Date(e.publish_at).getTime()   : null;
  const unpub= e?.unpublish_at ? new Date(e.unpublish_at).getTime() : null;
  if (pub && pub > now) return 'scheduled';
  if (unpub && unpub <= now) return 'expired';
  return 'live';
};

export const TAB_TO_STATUS: Status[] = ['all','live', 'scheduled', 'expired', 'hidden'];
export const applyFilter = (items: EventType[], tabIdx: number, setDisableDrag: (value:boolean)=>void ) => {
  if (tabIdx === 0){
    setDisableDrag(false)
    return items ?? []
  }else{
    console.log({ tabIdx })
    setDisableDrag(true)
    const wanted = TAB_TO_STATUS[tabIdx] ?? 'live';
    console.log({ wanted })
    return (items ?? []).filter(e => computeStatus(e) === wanted);
  }
};


export function shouldShowModal({
  publishModal,
  forceOpen,
  startDate,
  endDate,
}: {
  publishModal: boolean;
  forceOpen: boolean;
  startDate?: string;
  endDate?: string;
}) {
  if (!publishModal) return false;
  if (forceOpen) return true;
  const now = new Date();
  const s = startDate ? startOfDay(new Date(startDate)) : new Date(0);
  const e = endDate ? endOfDay(new Date(endDate)) : new Date(8640000000000000);
  return now >= s && now <= e;
}

export function startOfDay(d: Date) { const x = new Date(d); x.setHours(0,0,0,0); return x; }
export function endOfDay(d: Date)   { const x = new Date(d); x.setHours(23,59,59,999); return x; }
export function formatDateRange(start?: string, end?: string) {
  if (!start && !end) return '';
  if (start && !end) return pretty(start);
  if (!start && end) return pretty(end);
  const sd = new Date(start!); 
  const ed = new Date(end!);
  if (isNaN(sd.getTime()) || isNaN(ed.getTime())) return '';
  const sameMonth = sd.getFullYear() === ed.getFullYear() && sd.getMonth() === ed.getMonth();
  if (sameMonth) {
    const m = sd.toLocaleString(undefined, { month: 'short' });
    return `${m} ${sd.getDate()}–${ed.getDate()}, ${sd.getFullYear()}`;
  }
  return `${pretty(start!)} – ${pretty(end!)}`;
}

export function formatTimeRange(start?: string, end?: string) {
  const s = to12h(start);
  const e = to12h(end);

  if (!s && !e) return '';
  if (s && !e) return s;
  if (!s && e) return e;
  return `${s} – ${e}`;
}

function parseHM(t?: string): { h: number; m: number } | null {
  if (!t?.trim()) return null;

  const m = /^(\d{1,2})(?::(\d{1,2}))?(?::(\d{1,2})(?:\.\d+)?)?$/.exec(t.trim());
  if (!m) return null;

  const h = Number(m[1]);
  const min = Number(m[2] ?? '0');

  const sec = Number(m[3] ?? '0');

  if (
    Number.isNaN(h) || Number.isNaN(min) || Number.isNaN(sec) ||
    h < 0 || h > 23 || min < 0 || min > 59 || sec < 0 || sec > 59
  ) return null;

  return { h, m: min };
}

function pad2(n: number) {
  return n < 10 ? `0${n}` : String(n);
}

export function to12h(t?: string, opts?: { upper?: boolean }) {
  const hm = parseHM(t);
  if (!hm) return '';
  let hour = hm.h % 12;
  if (hour === 0) hour = 12;
  const suffix = hm.h < 12 ? 'am' : 'pm';
  const ampm = opts?.upper ? suffix.toUpperCase() : suffix;
  return `${hour}:${pad2(hm.m)} ${ampm}`;
}

export function toUtcIso(dtLocal?: string | null) {
  if (!dtLocal) return null;
  return new Date(dtLocal).toISOString();
}

export const toLocalInputValue = (iso?: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);           // parses as UTC; getters return local
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export function pretty(s: string) {
  const d = new Date(s); 
  if (isNaN(d.getTime())) return '';

  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}


export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
