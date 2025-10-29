'use client'
import { useRef, useState, useEffect } from "react";
import AddHotspotModal, {NewHotspotPayload} from "./AddHotspotModal";
import { fetchHotspots, Hotspots, UpdateDraft } from "@/app/components/helpersAndInputs";
import SnackbarComponent, {SnackbarSettings} from "@/app/components/Snackbar";
import { useUser } from "@/app/providers/UserProviders";
import HotspotModal from "./HotspotModal";
import { IconButton } from "@mui/material";
import { Refresh, ArrowBackOutlined } from "@mui/icons-material";
import UpdateHotspotPage from "./UpdateHotspotPage";
import AccordionGroup from "./AccordionGroup";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import KrpanoViewer from "@/app/components/KrpanoViewer";

export default function ContentPage(){
    const previewRef = useRef<HTMLIFrameElement | null>(null);
    const [openAddModal, setOpenAddModal] = useState(false)
    const [hotspots, setHotspots] = useState<Hotspots[] | null>(null)
    const [loading, setLoading] = useState(false)
    const [selectedHotspot, setSelectedHotspot] = useState<Hotspots | null>(null)
    const [open, setOpen] = useState(false)
    const [showUpdate, setShowUpdate] = useState(false)
    const { profile } = useUser()
    const [hasOrderChanges, setHasOrderChanges] = useState(false);
    const [savingOrder, setSavingOrder] = useState(false);


    const [snackbarSettings, setSnackbarSettings] = useState<SnackbarSettings>({
        open: false,
        message: '',
        severity: '',
      });

    const [updateDraft, setUpdateDraft] = useState<UpdateDraft>({
        name: '',
        description: null,
        image_url: null,
        id: '',
        level: null,
        startdate: null,
        enddate: null,
        starttime: null,
        endtime: null,
        title: null,
        cta_label: null,
        cta_href: null
    })

    function handleClose(){
        setOpenAddModal(false)
    }

    async function createHotspot(p: NewHotspotPayload) {
        const fd = new FormData();
        fd.append("name", p.name);
        if (p.description) fd.append("description", p.description);
        if (p.file) fd.append("file", p.file);
        if (p.level) fd.append("level", p.level);
        if (p.startdate) fd.append("startdate", p.startdate);
        if (p.enddate) fd.append("enddate", p.enddate);
        if (p.starttime) fd.append("starttime", p.starttime);
        if (p.endtime) fd.append("endtime", p.endtime);
        if (p.title) fd.append("title", p.title);
        if (p.cta_label) fd.append("cta_label", p.cta_label);
        if (p.cta_href) fd.append("cta_href", p.cta_href);


        const res = await fetch("/api/admin/hotspots/create", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) {
            setSnackbarSettings((prev) => ({...prev,
                open: true,
                message: 'Adding Hotspot Failed',
                severity: 'error'
            }))
            throw new Error(data?.error || "Create failed")
        } else {
            setSnackbarSettings((prev) => ({...prev,
                open: true,
                message: 'Added Hotspot Successfully',
                severity: 'success'
            }))
        };
    }

    async function deleteHotspot() {
        if (!selectedHotspot?.id) {
            setSnackbarSettings(prev => ({
                ...prev,
                open: true,
                message: 'Select a hotspot to delete',
                severity: 'error',
            }));
            return;
        }
        const ok = window.confirm(`Delete hotspot "${selectedHotspot.name}"?`);
        if (!ok) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/hotspots/${selectedHotspot.id}`, { method: 'DELETE' });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data?.error || 'Failed to delete hotspot');
            setSnackbarSettings(prev => ({
                ...prev,
                open: true,
                message: 'Hotspot deleted',
                severity: 'success',
            }));
            // Refresh list
            await fetchHotspots({ setHotspots, setLoading });
            // Clear selection / close modal
            setSelectedHotspot(null);
            setOpen(false);
            // Best-effort: refresh the preview iframe so viewer reloads
            try { previewRef.current?.contentWindow?.location?.reload(); } catch {}
            // Re-mount the local KrpanoViewer to trigger refetch

        } catch (e) {
            const msg = e instanceof Error ? e.message : 'Delete failed';
            setSnackbarSettings(prev => ({
                ...prev,
                open: true,
                message: msg,
                severity: 'error',
            }));
        } finally {
            setLoading(false);
        }
    }


    useEffect(()=>{
        fetchHotspots({setHotspots, setLoading})
    },[])

    console.log({open})
    const isHotspotModalOpen = Boolean(selectedHotspot) && open;
    console.log({isHotspotModalOpen})

    useEffect(() => {
        if (!selectedHotspot) return;

        setUpdateDraft({
            name: selectedHotspot.name ?? '',
            description: selectedHotspot.description ?? '' ,
            image_url: selectedHotspot.image_url ?? '',
            id: selectedHotspot.id,
            level: selectedHotspot.level ?? '',
            startdate: selectedHotspot.startdate ?? '',
            enddate: selectedHotspot.enddate ?? '',
            starttime: selectedHotspot.starttime ?? '',
            endtime: selectedHotspot.endtime ?? '',
            title: selectedHotspot.title ?? '',
            cta_label: selectedHotspot.cta_label ?? '',
            cta_href: selectedHotspot.cta_href ?? '',
        });
    }, [selectedHotspot]);

    function handleReorder(level: string, fromIndex: number, toIndex: number) {
        setHotspots((prev) => {
            if (!prev) return prev;
            const list = [...prev];
            const sameLevel = list.filter((h) => h.level === level);
            const moved = sameLevel[fromIndex];
            sameLevel.splice(fromIndex, 1);
            sameLevel.splice(toIndex, 0, moved);

            const updatedLevel = sameLevel.map((h, idx) => ({ ...h, order: idx }));

            const others = list.filter((h) => h.level !== level);
            const newHotspots = [...others, ...updatedLevel];

            setHasOrderChanges(true);
            return newHotspots;
        });
    }


    function handleDragEnd(result: DropResult) {
        const { source, destination } = result;
        if (!destination) return;
        if (source.droppableId === destination.droppableId) {
            handleReorder(source.droppableId, source.index, destination.index);
        }
    }

    async function saveOrder() {
    if (!hotspots || !hasOrderChanges) return;

    setSavingOrder(true);

    // Prepare data grouped by level
    const grouped = hotspots.reduce((acc, h) => {
        if (!acc[h.level]) acc[h.level] = [];
        acc[h.level].push({ id: h.id, order: h.order });
        return acc;
    }, {} as Record<string, { id: string; order: number }[]>);

    try {
        const res = await fetch("/api/admin/hotspots/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grouped }),
        });

        if (!res.ok) throw new Error("Failed to save order");

        setHasOrderChanges(false);
        setSnackbarSettings((prev) => ({
        ...prev,
        open: true,
        message: "Order saved successfully",
        severity: "success",
        }));
    } catch (e) {
        setSnackbarSettings((prev) => ({
        ...prev,
        open: true,
        message: e instanceof Error ? e.message : "Save failed",
        severity: "error",
        }));
    } finally {
        setSavingOrder(false);
    }
    }


    return(
        <div className="font-sans flex flex-col gap-4 md:flex-row min-h-screen md:h-screen p-8 md:gap-8 sm:px-20 bg-[#151c2f]">
            <div className="md:w-[30%] text-white h-[90%] md:overflow-scroll custom-scrollbar shadow-xl rounded-xl bg-[#212e3f] p-3 md:p-5 space-y-4">
                {/* Actions for devs only */}
                {profile?.role === 'super-admin' && (
                    <div
                        className="flex gap-2"
                    >
                        <button
                            onClick={()=>setOpenAddModal(true)}
                            className="bg-green-400 rounded-lg p-2 text-black hover:bg-green-500 hover:cursor-pointer"
                        >
                            Add
                        </button>
                        <button
                            onClick={deleteHotspot}
                            disabled={!selectedHotspot}
                            className="bg-red-500 rounded-lg p-2 text-white hover:bg-red-600 hover:cursor-pointer"
                        >
                            Delete
                        </button>
                        <button
                            onClick={saveOrder}
                            disabled={savingOrder || !hasOrderChanges}
                            className={`${
                                savingOrder ? "bg-gray-400" : "bg-blue-500 hover:bg-blue-600"
                            } rounded-lg p-2 text-white transition disabled:opacity-50`}
                            >
                            {savingOrder ? "Saving…" : "Save Order"}
                        </button>
                    </div>
                )}
                <div>
                </div>

                <div className="flex items-center justify-between px-4">
                    <span
                        className="text-md text-white/60"
                    >
                        {
                            selectedHotspot?.level ?? "Ammenities"
                        }
                    </span>
                    {
                        showUpdate ? (
                            <IconButton size="small" 
                                onClick={()=>{
                                    setShowUpdate(false)
                                    setSelectedHotspot(null)
                                }}
                            >
                                <div
                                    className='border border-[rgba(255,255,255,0.1)] flex justify-center items-center p-2 rounded hover:bg-white/10 transition duration-300 ease-in-out'>
                                    <ArrowBackOutlined htmlColor="#9ca3af" fontSize="small"/>
                                </div>
                            </IconButton>
                        ): (
                            <IconButton size="small"
                                onClick={()=>{
                                    fetchHotspots({ setHotspots, setLoading })
                                }}
                            >
                                <Refresh className="text-white/60 hover:cursor-pointer  hover:text-white/80"/>
                            </IconButton>
                        )
                    }
                    <AddHotspotModal open={openAddModal} onClose={handleClose} onCreate={createHotspot} />
                </div>

                {!loading && !showUpdate && (
                    <DragDropContext onDragEnd={handleDragEnd}>
                        <div className="rounded-lg h-[150px] md:h-[670px] overflow-scroll custom-scrollbar space-y-2">
                            {(() => {
                            const groups: Record<string, Hotspots[]> = {};
                            hotspots?.forEach((h) => {
                                const group = h.level || "Uncategorized";
                                if (!groups[group]) groups[group] = [];
                                groups[group].push(h);
                            });

                            const levelOrder = [
                                "Ground Level",
                                "Second Level",
                                "Third Level",
                                "Fifth Level",
                                "Sixth Level",
                                "60th Level",
                                "62nd Level",
                                "66th Level",
                            ];

                            return levelOrder.map((level) => (
                                <AccordionGroup
                                    key={level}
                                    title={level}
                                    droppableId={level}
                                    items={groups[level] || []}
                                    selectedHotspot={selectedHotspot}
                                    setSelectedHotspot={setSelectedHotspot}
                                    setOpen={setOpen}
                                    setShowUpdate={setShowUpdate}
                                />
                            ));
                            })()}
                        </div>
                    </DragDropContext>
                )}


                {/* todo create a dynamic hotspot for me */}
                {
                    showUpdate && (
                        <UpdateHotspotPage
                            hotspotId={selectedHotspot?.id}
                            onCancel={()=>{
                                setShowUpdate(false)
                                setSelectedHotspot(null)
                            }}
                            onSaved={()=>{
                                // setShowUpdate(false)
                                // setSelectedHotspot(null)
                            }}
                            initial={updateDraft}
                            onChange={(draft) => setUpdateDraft(draft)}
                        />
                    )
                }
            </div>
            <div className="md:w-[70%] h-[90%] md:overflow-scroll custom-scrollbar text-white shadow-xl rounded-xl bg-[#212e3f] gap-4 p-3 md:p-5">
                <div className="mb-2 text-sm text-white/60 w-full flex gap-x-2">
                    {/* <Refresh fontSize="small" className="text-white/60 hover:cursor-pointer  hover:text-white/80"/> */}
                    <span>
                        Live preview from website
                    </span>
                </div>
                <div className="relative w-full h-[720px] md:h-full border border-white/10 bg-white rounded-xl overflow-hidden">
                    {/* <iframe ref={previewRef} src="/" title="Website Live Preview" className="absolute inset-0 object-contain h-full w-full" /> */}
                    <KrpanoViewer
                        xml="/vtour/tour.xml"
                        container="contained"
                    />
                    <HotspotModal
                        open={isHotspotModalOpen}
                        onClose={() => {
                            // setOpen(false);
                            // setSelectedHotspot(null);
                        }}
                        hotspot={updateDraft}
                        container="contained"
                    />
                </div>
                <div className="mt-3 flex justify-between items-center border-t border-white/10 pt-3">
                    <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={open} onChange={(e) => setOpen(e.target.checked)} />
                        <span>Hotspot Modal popup (preview)</span>
                    </label>
                </div>
            </div>
            <SnackbarComponent snackbarSettings={snackbarSettings} setSnackbarSettings={setSnackbarSettings}/>
        </div>
    )
}