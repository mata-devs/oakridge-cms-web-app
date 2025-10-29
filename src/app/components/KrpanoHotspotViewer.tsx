"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";

/** Minimal krpano API */
interface Krpano {
  call(cmd: string): void;
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
    ReactHotspotClickLogger?: (hotspotName: string) => void;
  }
}

type Props = {
  xml: string;
  viewerId?: string;
  targetId?: string;
  style?: React.CSSProperties;
  setHotspot?: (hotspotName: string) => void;
};

export default function KrpanoHotspotViewer({
  xml,
  viewerId = "krpano_logger",
  targetId = "pano_logger",
  style,
  setHotspot,
}: Props) {
  const [scriptReady, setScriptReady] = useState(false);
  const krpanoRef = useRef<Krpano | null>(null);
  const embeddedRef = useRef(false);

  // ===================================================
  //  1️⃣  Global JS function called by krpano onclick
  // ===================================================
  useEffect(() => {
    window.ReactHotspotClickLogger = (hotspotName: string) => {
      console.log("🟢 hs_circle2 hotspot clicked:", hotspotName);
      if(setHotspot){
          setHotspot('');
          setTimeout(() => {
            setHotspot(hotspotName);
          }, 25);
      }
    };

    return () => {
      delete window.ReactHotspotClickLogger;
    };
  }, [setHotspot]);

  // ===================================================
  //  2️⃣  Embed pano and inject onclick handlers
  // ===================================================
  useEffect(() => {
    if (!scriptReady || embeddedRef.current) return;
    if (!window.embedpano) return;

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

        // Wait 0.5s for hs_circle2 hotspots to be generated, then attach onclick
        k.call(`
          delayedcall(0.5,
            for(set(i,0), i LT hotspot.count, inc(i),
              if(hotspot[get(i)].style == 'hs_circle2' OR contains(get(hotspot[get(i)].name),'_img2'),
                set(hotspot[get(i)].onclick, js(window.ReactHotspotClickLogger(get(name))));
              );
            );
          );
        `);

        console.log("✅ Logger attached to hs_circle2 and _img2 hotspots");
      },
    });

    embeddedRef.current = true;

    return () => {
      try {
        window.removepano?.(viewerId);
      } catch {}
      krpanoRef.current = null;
      embeddedRef.current = false;
    };
  }, [scriptReady, xml, viewerId, targetId]);

  // ===================================================
  //  3️⃣  Render viewer
  // ===================================================
  return (
    <>
      <Script
        src="/vtour/tour.js"
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
      />
      <div
        id={targetId}
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          ...style,
        }}
      />
    </>
  );
}
