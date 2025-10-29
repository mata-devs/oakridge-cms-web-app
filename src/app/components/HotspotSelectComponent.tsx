import { useEffect, useState } from "react";
import { Refresh } from "@mui/icons-material";

interface Hotspot {
  id: string;
  name: string;
  title: string;
}

interface HotspotSelectProps {
  value?: string;
  onChange: (value: string) => void;
}

export default function HotspotSelect({ value, onChange }: HotspotSelectProps) {
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHotspots = async () => {
    try {
      const res = await fetch("/api/admin/hotspots");
      const data = await res.json();
      setHotspots(data);
    } catch (err) {
      console.error("Failed to load hotspots:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHotspots();
  }, []);

  return (
    <>
      <label className="block">
        <div className="text-sm mb-1 text-white/80 flex justify-between">
          Hotspot Group
          <Refresh fontSize="small" className="text-white/50 cursor-pointer"
            onClick={() => {
              setLoading(true);
              fetchHotspots();
            }}
          />
        </div>
        <select
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={loading}
          className="w-full rounded-lg bg-[#131a2a] border border-white/10 px-2 py-2 outline-none focus:border-white/30 text-white/50"
        >
          <option value="" disabled  className="">
            {loading ? "Loading..." : "Select a hotspot..."}
          </option>
          {hotspots.map((hotspot) => (
            <option key={hotspot.id} value={hotspot.name}>
              {hotspot.title}
            </option>
          ))}
        </select>
      </label>
    </>
  );
}
