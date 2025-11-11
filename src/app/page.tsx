"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import EventModalOverlay2 from "./components/EventModalOverlay2";
import { fetchEventsForClient, EventType, formatDateRange, formatTimeRange } from "./components/helpersAndInputs";
import KrpanoHotspotViewer from "./components/KrpanoHotspotViewer";

export default function Home() {
  const [events, setEvents] = useState<EventType[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [open, setOpen] = useState(false);
  const [hotspotGroup, setHotspotGroup] = useState<string>("");

  // useEffect(() => {
  //   if (!hotspotGroup) {
  //     setEvents([]);
  //     setShowModal(false);
  //     setOpen(false);
  //     return;
  //   }

  //   const load = async () => {
  //     setLoadingEvents(true);
  //     await fetchEventsForClient({ setEvents, setLoadingEvents, hotspotGroup });
  //     setLoadingEvents(false);

  //     const isInIframe = window.self !== window.top;
  //     if (!isInIframe) {
  //       setShowModal(true);
  //       setOpen(true);
  //     }
  //   };
  //   load();
  // }, [hotspotGroup]);

  useEffect(() => {
    if (!hotspotGroup) {
      setEvents([]);
      setShowModal(false);
      setOpen(false);
      return;
    }

    setShowModal(true);
    setOpen(true);
    setLoadingEvents(true);

    const load = async () => {
      await fetchEventsForClient({ setEvents, setLoadingEvents, hotspotGroup });
      setLoadingEvents(false);
    };
    load();
  }, [hotspotGroup]);

  const onClose = () => {
    setOpen(false);
    setShowModal(false);
    setHotspotGroup("");
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <KrpanoHotspotViewer xml="/vtour/tour.xml" setHotspot={setHotspotGroup} />

      <AnimatePresence>
        {/* {showModal && events.length > 0 && open && (
          <motion.div
            key="eventModal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-sm z-50"
          >
            <EventModalOverlay2
              container="fullscreen"
              open={open}
              onClose={onClose}
              events={events.map((e) => ({
                ...e,
                imageUrl: e.image_url ?? undefined,
                title: e.title ?? "(untitled)",
                subheading: e.subheading ?? "",
                description: e.description ?? "",
                dateRange: formatDateRange(e.start_date, e.end_date),
                timeText: formatTimeRange(e.start_time, e.end_time),
                ctaLabel: e.cta_label ?? "",
                ctaHref: e.cta_href ?? "",
              }))}
              initialIndex={0}
            />
          </motion.div>
        )} */}

        {showModal && open && (
          <motion.div
            key="eventModal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-sm z-50"
          >
            {loadingEvents ? (
              <div
                className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex items-center justify-center p-4 lg:p-0"
                onClick={onClose}
              >
                <div
                  className="relative w-full max-w-4xl rounded-2xl bg-white shadow-2xl h-[50%] p-6 "
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Close button */}
                  <div className="absolute z-30 top-0 right-0 translate-x-1/3 -translate-y-1/3">
                    <button
                      onClick={onClose}
                      aria-label="Close"
                      className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-full bg-red-500 text-white shadow-lg ring-4 ring-white hover:bg-red-600 transition hover:cursor-pointer"
                    >
                      ×
                    </button>
                  </div>

                  <div className="animate-pulse flex flex-col items-center justify-center h-full space-y-6">
                    <div className="h-6 bg-gray-200 rounded w-32"></div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 w-full px-6">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <div
                          key={i}
                          className="w-full aspect-[4/3] rounded-xl bg-gray-200"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            
            ) : events.length > 0 ? (
              <EventModalOverlay2
                container="fullscreen"
                open={open}
                onClose={onClose}
                events={events.map((e) => ({
                  ...e,
                  imageUrl: e.image_url ?? undefined,
                  title: e.title ?? "(untitled)",
                  subheading: e.subheading ?? "",
                  description: e.description ?? "",
                  dateRange: formatDateRange(e.start_date, e.end_date),
                  timeText: formatTimeRange(e.start_time, e.end_time),
                  ctaLabel: e.cta_label ?? "",
                  ctaHref: e.cta_href ?? "",
                }))}
                initialIndex={0}
              />
            ) : (
              <div
                className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex items-center justify-center p-4 lg:p-0"
                onClick={onClose}
              >
                <div
                  className="relative w-full max-w-4xl rounded-2xl bg-white shadow-2xl h-[50%] flex flex-col items-center justify-center p-8 text-center"
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

                  <div className="flex flex-col items-center space-y-4">
                    <div className="text-gray-500 text-6xl">😕</div>
                    <h2 className="text-2xl font-semibold text-neutral-700">
                      No Events Found
                    </h2>
                    <p className="text-neutral-500 max-w-md">
                      There are no exhibits or events available for this location.
                    </p>
                    <button
                      onClick={onClose}
                      className="mt-4 inline-flex items-center justify-center rounded-full bg-red-600 hover:bg-red-500 hover:shadow-2xl duration-300 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white shadow hover:opacity-95"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}


      </AnimatePresence>
    </div>
  );
}
