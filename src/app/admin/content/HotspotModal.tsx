"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { Hotspots } from "@/app/components/helpersAndInputs";
import { ImageLightbox } from "@/app/components/Lightbox";
import { formatDateRange, formatTimeRange } from "@/app/components/helpersAndInputs";
import { DateRange, Schedule } from "@mui/icons-material";

type HotspotModalOverlayProps = {
  open: boolean;
  onClose: () => void;
  hotspot: Hotspots | null;
  container: string
};

export default function HotspotModalOverlay({
  open,
  onClose,
  hotspot,
  container = 'contained'
}: HotspotModalOverlayProps) {
  const [busy, setBusy] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [current, setCurrent] = useState<{dateRange?: string | null; timeText?: string | null}>({})

  useEffect(() => {
    if (!open) {
      setBusy(false);
    }
  }, [open]);

  useEffect(() => {
    setCurrent({
      dateRange: formatDateRange(hotspot?.startdate || '', hotspot?.enddate || ''),
      timeText: formatTimeRange(hotspot?.starttime || '', hotspot?.endtime || '')
    })
  }, [hotspot?.startdate, hotspot?.enddate, hotspot?.starttime, hotspot?.endtime]);

  console.log({hotspot})
  if (!hotspot) return null;
  if (!hotspot.title && !hotspot.description && !hotspot.image_url && !current.dateRange && !current.timeText) return null;
  if (!open) return null;

  console.log({hotspot})



  const pos = container === 'contained' ? 'absolute' : 'fixed';
  const z   = container === 'contained' ? 'z-10' : 'z-[50]';

  return (
    <div id="hotspotModal" className={`${pos} inset-0 ${z} flex p-4 lg:p-0 items-center justify-center`} role="dialog" aria-modal="true">
      <div className={`${pos} inset-0 bg-black/60 backdrop-blur-[1px]`} onClick={onClose} />

      <div className="relative z-10 w-full max-w-[400px] md:max-w-[560px] rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute -right-3 -top-3 flex h-10 w-10 items-center justify-center rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg cursor-pointer ring-4 ring-white"
        >
          ×
        </button>

        <div className="px-5 pb-5 pt-6">
          {hotspot?.image_url && (
            <div className={`relative mx-auto mb-4 h-32 w-full overflow-hidden rounded-xl  ${container === 'fullscreen'? 'md:h-60' : 'md:h-32' }`}>
              <Image
                src={hotspot.image_url}
                alt={hotspot.title || ''}
                fill
                unoptimized
                className="object-contain object-center bg-black/50 cursor-zoom-in
                  hover:scale-[1.02] transition-transform duration-300 hover:opacity-70 hover:duration-500"
                sizes="(max-width: 640px) 100vw, 560px"
                priority
                onClick={() => setLightboxOpen(true)}
              />
              <ImageLightbox
                open={lightboxOpen}
                src={hotspot.image_url || ''}
                alt={hotspot.name || ''}
                imageRef={imageRef}
                onClose={() => setLightboxOpen(false)}
              />
            </div>
          )}

          <h2 className="text-center text-neutral-600 text-3xl font-semibold tracking-tight whitespace-pre-wrap break-words [overflow-wrap:anywhere] hyphens-auto">
            {hotspot?.title}
          </h2>

          {(current?.dateRange || current?.timeText) && (
            <div className="mt-2 flex items-center justify-center gap-5 text-sm text-neutral-700">
              {current?.dateRange && (
                <span className="inline-flex items-center gap-1.5">
                  <DateRange sx={{ fontSize: 20 }}/>
                  {/* <span className="inline-block h-5 w-5 rounded-[4px] border border-neutral-400" /> */}
                  {current?.dateRange}
                </span>
              )}
              {current?.timeText && (
                <span className="inline-flex items-center gap-1.5">
                  <Schedule sx={{ fontSize: 20 }}/>
                  {/* <span className="inline-block h-5 w-5 rounded-full border border-neutral-400" /> */}
                  {current?.timeText}
                </span>
              )}
            </div>
          )}

          {!!hotspot?.description && (
            <div className="mt-4 max-h-56 overflow-y-auto">
              <p className="text-sm leading-relaxed text-neutral-800 whitespace-pre-wrap break-words [overflow-wrap:anywhere] hyphens-auto">
                {hotspot?.description}
              </p>
            </div>
          )}

          {(hotspot?.cta_label || hotspot?.cta_href) && (
            <div className="mt-6 flex justify-center">
              {hotspot?.cta_href ? (
                <a
                  href={hotspot?.cta_href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center rounded-full bg-red-600 hover:bg-red-500 hover:shadow-2xl duration-300 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white shadow hover:opacity-95"
                >
                  {hotspot?.cta_label ?? 'Learn more'}
                </a>
              ) : (
                <button className="inline-flex items-center justify-center rounded-full bg-red-600 hover:bg-red-500 hover:shadow-2xl duration-300 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white shadow hover:opacity-95" >
                  {hotspot?.cta_label ?? 'Learn more'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
