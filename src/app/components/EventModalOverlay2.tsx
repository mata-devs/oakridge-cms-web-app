'use client';

import { useState } from 'react';
import Image from 'next/image';
import EventModalOverlay from './EventModalOverlay';

export type EventItem = {
  imageUrl?: string;
  title: string;
  subheading?: string;
  description?: string;
  dateRange?: string;
  timeText?: string;
  ctaLabel?: string;
  ctaHref?: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  events: EventItem[];
  container?: 'contained' | 'fullscreen';
  initialIndex?: number;
  hotspot_logo?: string;
};

export default function EventModalOverlay2({
  open,
  onClose,
  events,
  container = 'contained',
  initialIndex = 0,
  hotspot_logo,
}: Props) {
  const [selected, setSelected] = useState<EventItem | null>(null);

  if (!open || (events?.length ?? 0) < 1) return null;

  const pos = container === 'contained' ? 'absolute' : 'fixed';
  const z = container === 'contained' ? 'z-10' : 'z-[99999]';

  return (
    <>
      <div
        className={`${pos} inset-0 ${z} flex items-center justify-center p-4 lg:p-0`}
        role="dialog"
        aria-modal="true"
      >
        {/* Background overlay */}
        <div
          className={`${pos} inset-0 bg-black/60 backdrop-blur-[1px]`}
          onClick={onClose}
        />

        {/* Exhibit list modal */}
        <div
          className="relative w-full max-w-4xl rounded-2xl bg-white shadow-2xl h-[80%] flex flex-col "
          onClick={(e) => e.stopPropagation()}
        >
          <div className="absolute z-30 top-0 right-0 translate-x-1/3 -translate-y-1/3">
            <button
              onClick={onClose}
              aria-label="Close"
              className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-full bg-red-500 text-white shadow-lg ring-4 ring-white hover:bg-red-600 transition hover:cursor-pointer"
            >
              ×
            </button>
          </div>

          <div className='h-[80%] '>
            <div className="flex flex-col items-center justify-center pt-4 px-6 relative">
              {
                hotspot_logo && (
                  <>
                    <Image
                      src={hotspot_logo}
                      alt="Hotspot Logo"
                      width={0}
                      height={0}
                      sizes="100vw"
                      className="w-full h-32 object-contain rounded-t-2xl bg-white p-4"
                    />
                  </>
                )
              }
              <h2 className=" bg-white text-center text-2xl font-semibold mb-6 text-neutral-700">
                Exhibitors
              </h2>
            </div>
            <div className='h-[75%] md:h-[85%] flex flex-col justify-center'>
              <div className="p-4 md:p-6 h-full overflow-y-auto custom-scrollbar">

                {/* Exhibit grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 ">
                  {events.map((item, i) => (
                    <div
                      key={i}
                      onClick={() => setSelected(item)}
                      className="group relative cursor-pointer overflow-hidden rounded-xl bg-neutral-100 hover:bg-neutral-200 transition duration-300"
                    >
                      <div className="relative w-full aspect-[4/3]">
                        {item.imageUrl ? (
                          <Image
                            src={item.imageUrl}
                            alt={item.title}
                            fill
                            unoptimized
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex items-center justify-center w-full h-full bg-gray-300 text-gray-600">
                            No Image
                          </div>
                        )}
                      </div>
                      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition" />
                      <div className="absolute bottom-0 left-0 right-0 p-3 text-white text-center">
                        <p className="font-medium text-sm md:text-base truncate">
                          {item.title}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* CTA Modal */}
      {selected && (
        // <CTAModal
        //   open={!!selected}
        //   item={selected}
        //   onClose={() => setSelected(null)}
        // />
        <EventModalOverlay
          container="fullscreen"
          open={!!selected}
          onClose={() => setSelected(null)}
          events={[selected]}
        />
      )}
    </>
  );
}
