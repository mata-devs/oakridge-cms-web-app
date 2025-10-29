"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import EventModalOverlay from "./components/EventModalOverlay";
import { fetchEventsForClient, EventType, formatDateRange, formatTimeRange } from "./components/helpersAndInputs";
import KrpanoHotspotViewer from "./components/KrpanoHotspotViewer";

export default function Home() {
  const [events, setEvents] = useState<EventType[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [open, setOpen] = useState(false);
  const [hotspotGroup, setHotspotGroup] = useState<string>("");

  useEffect(() => {
    if (!hotspotGroup) {
      setEvents([]);
      setShowModal(false);
      setOpen(false);
      return;
    }

    const load = async () => {
      setLoadingEvents(true);
      await fetchEventsForClient({ setEvents, setLoadingEvents, hotspotGroup });
      setLoadingEvents(false);

      const isInIframe = window.self !== window.top;
      if (!isInIframe) {
        setShowModal(true);
        setOpen(true);
      }
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
        {showModal && events.length > 0 && open && (
          <motion.div
            key="eventModal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-sm z-50"
          >
            <EventModalOverlay
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
        )}
      </AnimatePresence>
    </div>
  );
}
