"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { fetchHotspots, Hotspots } from "./helpersAndInputs";
import HotspotModalOverlay from "../admin/content/HotspotModal";
import { usePathname } from "next/navigation";
import EventModalOverlay from "./EventModalOverlay";

/** Minimal krpano API we use */
interface Krpano {
  call(cmd: string): void;
  set(path: string, value: string | number | boolean): void;
  get(path: string): unknown;
}
interface EmbedPanoOptions {
  id: string;
  target: string;
  xml: string;
  html5?: "only" | "auto";
  consolelog?: boolean;
  debugmode?: boolean;
  passQueryParameters?: boolean;
  onready?: (k: Krpano) => void;
  [key: string]: unknown;
}

declare global {
  interface Window {
    embedpano?: (opts: EmbedPanoOptions) => void;
    removepano?: (id: string) => void;
    getkrpano?: (idOrDiv: string) => Krpano | undefined;
    ReactKrpanoLayerClick?: (layerName: string) => void;
  }
}

type Props = {
  xml: string;
  viewerId?: string;
  targetId?: string;
  style?: React.CSSProperties;
  options?: Record<string, unknown>;
  container?: 'contained' | 'fullscreen';
};

export default function KrpanoViewer({
  xml,
  viewerId = "krpano1",
  targetId = "pano1",
  style,
  options,
  container= 'fullscreen',
}: Props) {
  const [scriptReady, setScriptReady] = useState(false);
  const [hotspots, setHotspots] = useState<Hotspots[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspots | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const embeddedRef = useRef(false);
  const krpanoRef = useRef<Krpano | null>(null);
  const pathname = usePathname();

  // ==============================
  //  FETCH HOTSPOTS
  // ==============================
  useEffect(() => {
    fetchHotspots({ setHotspots, setLoading });
  }, []);


  const callKrpanoAction = (action: string) => {
    const k = krpanoRef.current ?? window.getkrpano?.(viewerId);
    if (k) k.call(`${action}()`);
  };

  // ==============================
  //  LAYER CLICK HANDLER (submenu)
  // ==============================
  useEffect(() => {
    console.log("before")
    window.ReactKrpanoLayerClick = (layerName: string) => {
      console.log("after")
      const k = krpanoRef.current ?? window.getkrpano?.(viewerId);
      console.log("layer clicked:", layerName)
      if (!k) return;

      // Only respond to submenu layers (submenu10, submenu11, etc)
      if (!layerName.startsWith("submenu")) return;

      // Get the visible text (HTML) from that submenu layer
      const html = k.get(`layer[${layerName}].html`);
      if (!html) return;

      // Match it to your fetched hotspot names
      const match = hotspots.find(
        (h) =>
          h.name?.trim().toLowerCase() ===
          String(html).trim().toLowerCase()
      );

      if (match) {
        console.log("🟢 Submenu clicked:", html, "→ hotspot:", match);
        setSelectedHotspot(match);
        setModalOpen(true);

        k.call("closem()");
        k.call("close()");
      } else {
        console.warn("⚠️ No hotspot matched submenu:", html);
      }
    };

    return () => {
      delete window.ReactKrpanoLayerClick;
    };
  }, [hotspots, viewerId]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      console.log("Path:", window.location.pathname);
    }
  }, []);

  // ==============================
  //  EMBED KRPANO
  // ==============================
  useEffect(() => {
    if (!scriptReady || loading) return;
    if (!window.embedpano) return;
    if (embeddedRef.current) {
      krpanoRef.current = window.getkrpano?.(viewerId) ?? null;
      return;
    }

    window.embedpano({
      id: viewerId,
      target: targetId,
      xml,
      html5: "only",
      consolelog: true,
      debugmode: false,
      passQueryParameters: true,
      jsaccess: "full",
      onready: (k: Krpano) => {
        krpanoRef.current = k;
        console.log(k)

        // Register global click listener for all KRPano layers
        // Ensure submenu layers can capture clicks
        console.log(pathname)
        if (pathname.includes("grandhyatt") ) {
          console.log("🌇 Loading admin default scene: ninort");
          k.call(`
             delayedcall(1,
              loadscene(scene_ninort, null, MERGE, BLEND(get(transitiontime),get(transitiontweentype)));
            );
          `);
        }
        k.call(`
          for(set(i,0), i LT layer.count, inc(i),
            if(startswith(get(layer[get(i)].name), 'submenu'),
              set(layer[get(i)].enabled, true);
              set(layer[get(i)].bgcapture, true);
              set(layer[get(i)].onclick, js(window.ReactKrpanoLayerClick(get(name))));
            );
          );
        `);


        console.log("✅ KRPano ready, XML loaded");
      },
      ...(options || {}),
    });

    embeddedRef.current = true;
  }, [scriptReady, loading, xml, viewerId, targetId, options, pathname]);

  console.log({hotspots})
  console.log({selectedHotspot})

  // ==============================
  //  CLEANUP ON UNMOUNT
  // ==============================
  useEffect(() => {
    return () => {
      try {
        window.removepano?.(viewerId);
      } catch {}
      embeddedRef.current = false;
      krpanoRef.current = null;
    };
  }, [viewerId]);

  // ==============================
  //  RENDER
  // ==============================
  return (
    <>
      {/* Load the krpano engine */}
      <Script
        src="/vtour/tour.js"
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
      />

      {/* The actual pano container */}
      <div
        id={targetId}
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          ...style,
        }}
      />

      {/* Hotspot Modal */}
      {container === 'fullscreen' && selectedHotspot && (
        <HotspotModalOverlay
          open={modalOpen}
          onClose={() => {
            setModalOpen(false);
            // setTimeout(() => {
              callKrpanoAction("open")
            // }, 100);
          }}
          hotspot={selectedHotspot}
          container={container}
        />
      )}
    </>
  );
}
