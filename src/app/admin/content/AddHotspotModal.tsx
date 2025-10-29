"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { LabeledDate } from "@/app/components/helpersAndInputs";

export type NewHotspotPayload = {
  name: string;
  description?: string | null;
  file: File | null;
  level?: string | null;
  startdate?: string | null;
  enddate?: string | null;
  starttime?: string | null;
  endtime?: string | null;
  title?: string | null;
  cta_label?: string | null;
  cta_href?: string | null;
};

type AddHotspotModalProps = {
  open: boolean;
  onClose: () => void;
  onCreate: (payload: NewHotspotPayload) => Promise<void> | void;
};

export default function AddHotspotModal({
  open,
  onClose,
  onCreate,
}: AddHotspotModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [level, setLevel] = useState<string>("");
  const [startdate, setStartdate] = useState('');
  const [enddate, setEnddate] = useState('');
  const [starttime, setStarttime] = useState('');
  const [endtime, setEndtime] = useState('');
  const [title, setTitle] = useState('');
  const [cta_label, setCta_label] = useState('');
  const [cta_href, setCta_href] = useState('');

  useEffect(() => {
    if (!open) {
      setName("");
      setDescription("");
      setFile(null);
      setLevel("");
      setStartdate('');
      setEnddate('');
      setStarttime('');
      setEndtime('');
      setTitle('');
      setCta_href('');
      setCta_label('');
      setBusy(false);
      setError(null);
    }
  }, [open]);

  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function onPickFile() {
    fileInputRef.current?.click();
  }

  function onFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setError("Please select an image (png/jpg/webp/gif).");
      return;
    }
    setError(null);
    setFile(f);
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f && f.type.startsWith("image/")) {
      setError(null);
      setFile(f);
    }
  }

  // const toNum = (v: string): number | null => {
  //   const t = v.trim();
  //   if (!t) return null;
  //   const n = Number(t);
  //   return Number.isFinite(n) ? n : null;
  // };

  async function handleCreate() {
    try {
      setError(null);
      if (!name.trim()) {
        setError("Hotspot name is required.");
        return;
      }

      setBusy(true);
      await onCreate({
        name: name.trim(),
        description: description.trim() || null,
        file,
        level: level || null,
        startdate: startdate || null,
        enddate: enddate || null,
        starttime: starttime || null,
        endtime: endtime || null,
        title: title || null,
        cta_label: cta_label || null,
        cta_href: cta_href || null
      });
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create hotspot.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onClose={busy ? () => {} : onClose} className="relative z-[2000]">
      <DialogBackdrop className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <DialogPanel className="w-full max-w-lg rounded-2xl bg-[#212e3f] p-5 text-white shadow-xl ring-1 ring-white/10">
            <DialogTitle className="text-lg font-semibold">Add Hotspot</DialogTitle>

            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="block">
                  <div className="mb-1 text-sm text-white/80">Ammenity</div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg bg-[#131a2a] border border-white/10 px-3 py-2 outline-none focus:border-white/30"
                    placeholder="e.g., Lobby"
                    disabled={busy}
                  />
                </label>
                

                {/* <label className="block">
                  <div className="mb-1 text-sm text-white/80">Scene (optional)</div>
                  <input
                    type="text"
                    value={scene}
                    onChange={(e) => setScene(e.target.value)}
                    className="w-full rounded-lg bg-[#131a2a] border border-white/10 px-3 py-2 outline-none focus:border-white/30"
                    placeholder="e.g., scene_lobby"
                    disabled={busy}
                  />
                </label> */}
                <label className="block">
                  <div className="mb-1 w-full text-sm text-white/80">Group</div>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
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
              </div>
              <label className="block">
                  <div className="mb-1 text-sm text-white/80">Title</div>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-lg bg-[#131a2a] border border-white/10 px-3 py-2 outline-none focus:border-white/30"
                    placeholder="e.g., Lobby"
                    disabled={busy}
                  />
                </label>
              <div className="grid grid-cols-2 gap-2">
                <LabeledDate label="Start date" value={startdate} onChange={setStartdate} />
                <LabeledDate label="End date" value={enddate} onChange={setEnddate} min={startdate || undefined} />
              </div>
  
              <div className="grid grid-cols-2 mt-1 gap-2">
                <label className="block">
                  <div className="text-sm mb-1 text-white/80">
                    Start time
                  </div>
                  <input
                    style={{ colorScheme: 'dark' }}
                    type="time"
                    value={starttime}
                    onChange={(e) => setStarttime(e.target.value)}
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
                    value={endtime}
                    onChange={(e) => setEndtime(e.target.value)}
                    className="w-full rounded-lg bg-[#131a2a] border border-white/10 px-3 py-2 outline-none focus:border-white/30"
                  />
                </label>
              </div>
              <div className='grid grid-cols-2 mt-1 gap-2'>
                <label className="block">
                  <div className="text-sm mb-1 text-white/80">CTA Label</div>
                  <input value={cta_label || ''} onChange={()=>{}} placeholder="Learn More" className="w-full rounded-lg bg-[#131a2a] border border-white/10 px-3 py-2 outline-none focus:border-white/30" />
                </label>
                <label className="block">
                  <div className="text-sm mb-1 text-white/80">CTA Link</div>
                  <input value={cta_href || ''} onChange={()=>{}} placeholder="https://example.com" className="w-full rounded-lg bg-[#131a2a] border border-white/10 px-3 py-2 outline-none focus:border-white/30" />
                </label>
              </div>

              <label className="block">
                <div className="mb-1 text-sm text-white/80">Description</div>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg bg-[#131a2a] border border-white/10 px-3 py-2 outline-none focus:border-white/30"
                  placeholder="Optional details…"
                  disabled={busy}
                />
              </label>

              <div
                className="rounded-xl border border-dashed border-white/15 bg-[#131a2a] p-3"
                onDragOver={(e) => e.preventDefault()}
                onDrop={onDrop}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm text-white/80">Hotspot image (optional)</div>
                    <div className="text-xs text-white/50">PNG/JPG/WEBP/GIF</div>
                  </div>
                  <button
                    type="button"
                    onClick={onPickFile}
                    disabled={busy}
                    className="rounded-md bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20 disabled:opacity-50"
                  >
                    Browse…
                  </button>
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
                    {/* eslint-disable-next-line @next/next/no-img-element */}
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
                  onClick={onClose}
                  disabled={busy}
                  className="rounded-lg px-3 py-2 text-sm bg-white/10 hover:bg-white/20 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={busy || !name.trim()}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-black bg-green-400 hover:bg-green-500 disabled:opacity-50"
                >
                  {busy ? "Saving…" : "Create"}
                </button>
              </div>
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}
