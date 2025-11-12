
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import EventModalOverlay from '@/app/components/EventModalOverlay';
import { uploadEventImage } from '../../../lib/images/uploadEventImages'
import {
  Tabs, Tab, Box, Select, MenuItem,
  IconButton, CircularProgress,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import RefreshIcon from '@mui/icons-material/Refresh';
import EditIcon from '@mui/icons-material/EditOutlined';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import SnackbarComponent, {SnackbarSettings} from './Snackbar';
import { LabeledDate, LabeledInput, LabeledTextarea, 
  shouldShowModal, formatDateRange, fileToDataUrl,
  ImageDropzone, EventType, fetchEventsForAdmin, formatTimeRange, 
  toUtcIso, applyFilter, toLocalInputValue} from './helpersAndInputs';
import { StatusPill } from './statusPill';
import { ArrowBackOutlined } from '@mui/icons-material';
import MainHotspotModal from './MainHotspotModal';
import { useUser } from '../providers/UserProviders';
import HotspotSelect from './HotspotSelectComponent';

export default function CMSPage() {
  const [mounted, setMounted] = useState(false);
  const [title, setTitle] = useState('');
  const [subheading, setSubheading] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const {profile} = useUser();
  const [hotspotGroup, setHotspotGroup] = useState<string>('');


  // Schedule/time
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  const [published, setPublished] = useState<boolean>(false);
  const [publishAt, setPublishAt] = useState<string>('');
  const [unpublishAt, setUnpublishAt] = useState<string>('');

  // Modal controls (preview/editor only)
  const [publishModal, setPublishModal] = useState(true);
  const [forceOpen, setForceOpen] = useState(true);
  const [ctaLabel, setCtaLabel] = useState('');
  const [ctaHref, setCtaHref] = useState('');

  const [eventId, setEventId] = useState<string | null>(null);
  const [tab, setTab] = useState(0);

  const [events, setEvents] = useState<EventType[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [selectedUpdateId, setSelectedUpdateId] = useState<string>('');
  const [selectedEvent, setSelectedEvent] = useState<EventType>({
    id: '',
    title: '',
    subheading: '',
    category: '',
    description: '',
    start_date: '',
    end_date: '',
    start_time: '',
    end_time: '',
    cta_label: '',
    cta_href: '',
    image_url: '',
    image_path: '',
    order: 0,
    hotspot_group: '',
  });
  const [hasOrderChanges, setHasOrderChanges] = useState(false);

  const [showUpdateView, setShowUpdateView] = useState(false);
  const [buttonLoading, setButtonLoading] = useState(false);
  const [snackbarSettings, setSnackbarSettings] = useState<SnackbarSettings>({
    open: false,
    message: '',
    severity: '',
  });
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [filterTab, setFilterTab] = useState(0);
  const [disableDrag, setDisableDrag] = useState(false);
  const [openHotspotModal, setOpenHotspotModal] = useState(false);


  const DRAFT_KEY = 'cmsDraft_v1';
  const inputRef = useRef<HTMLInputElement | null>(null);
  const previewRef = useRef<HTMLIFrameElement | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => setReady(true), []);

  /**  from localStorage */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const s = JSON.parse(raw);
      setTitle(s.title || '');
      setSubheading(s.subheading || '');
      setCategory(s.category || '');
      setDescription(s.description || '');
      setStartDate(s.startDate || '');
      setEndDate(s.endDate || '');
      setStartTime(s.startTime || '');
      setEndTime(s.endTime || '');
      setPublishModal(s.publishModal ?? true);
      setForceOpen(s.forceOpen ?? true);
      setCtaLabel(s.ctaLabel || '');
      setCtaHref(s.ctaHref || '');
      setPublished(s.published ?? true);
      setPublishAt(s.publishAt ?? '');
      setUnpublishAt(s.unpublishAt ?? '');
      if (s.imageDataUrl) setImageUrl(s.imageDataUrl);
    } catch {}
  }, []);

  /** Autosave */
  useEffect(() => {
    const id = setTimeout(async () => {
      try {
        let imageDataUrl = imageUrl;
        if (!imageDataUrl && imageFile) {
          imageDataUrl = await fileToDataUrl(imageFile);
          setImageUrl(imageDataUrl);
        }
        localStorage.setItem(
          DRAFT_KEY,
          JSON.stringify({
            title,
            subheading,
            category,
            description,
            startDate,
            endDate,
            startTime,
            endTime,
            publishModal,
            forceOpen,
            ctaLabel,
            ctaHref,
            imageDataUrl,
            published,
            publishAt,
            unpublishAt
          }),
        );
      } catch {}
    }, 300);
    return () => clearTimeout(id);
  }, [title, subheading, category, description, startDate, endDate, startTime, endTime, publishModal, forceOpen, ctaLabel, ctaHref, imageFile, imageUrl, published, publishAt, unpublishAt]);

  useEffect(() => {
    const id = setTimeout(() => {
      let imageDataUrl: string | null =
        imageUrl && imageUrl.startsWith('data:') ? imageUrl : null;
      if (!imageDataUrl) {
        try {
          const raw = localStorage.getItem(DRAFT_KEY);
          imageDataUrl = raw ? JSON.parse(raw).imageDataUrl ?? null : null;
        } catch {}
      }
      const payload = {
        title, subheading, category, description, startDate, endDate, startTime, endTime,
        publishModal, forceOpen, ctaLabel, ctaHref, imageDataUrl,
      };
      previewRef.current?.contentWindow?.postMessage(
        { type: 'cms:update', payload },
        window.location.origin,
      );
    }, 120);
    return () => clearTimeout(id);
  }, [title, subheading, category, description, startDate, endDate, startTime, endTime, publishModal, forceOpen, ctaLabel, ctaHref, imageUrl]);

  function onPickClick() { inputRef.current?.click(); }

  function onFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (f) handleNewImageFile(f);
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault(); const f = e.dataTransfer.files?.[0];
    if (f && f.type.startsWith('image/')) handleNewImageFile(f);
  }

  function onDragOver(e: React.DragEvent<HTMLDivElement>) { e.preventDefault(); }
  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      if (!e.clipboardData) return;
      const item = Array.from(e.clipboardData.items).find((i) => i.type.startsWith('image/'));
      if (!item) return;
      const f = item.getAsFile();
      if (f) handleNewImageFile(f);
    }
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, []);
  function handleNewImageFile(f: File) {
    setImageFile(f);
    const url = URL.createObjectURL(f);
    setImageUrl(url);
  }

  function resetAll() {
    setTitle(''); setSubheading(''); setCategory('');
    setDescription('');
    setStartDate(''); setEndDate(''); setStartTime('');
    setPublishModal(true); setForceOpen(true);
    setCtaLabel(''); setCtaHref('');
    setImageFile(null); setImageUrl(null);
    localStorage.removeItem(DRAFT_KEY);
    setSelectedUpdateId('');
    setSelectedEvent({ id: '' });
    setShowUpdateView(false);
    setEndTime('');
    setPublished(false);
    setPublishAt('');
    setUnpublishAt('');
    setHotspotGroup('');
  }

  function clearForm() {
    setTitle(''); setSubheading(''); setCategory(''); setDescription('');
    setStartDate(''); setEndDate(''); setStartTime('');
    setCtaLabel(''); setCtaHref('');
    setImageFile(null); setImageUrl(null);
    localStorage.removeItem(DRAFT_KEY);
    setPublished(false);
    setPublishAt('');
    setUnpublishAt('');
    setHotspotGroup('');
  }

  function onDragEnd(result: DropResult) {
    if (!result.destination) return;
    const src = result.source.index;
    const dst = result.destination.index;
    if (src === dst) return;

    setEvents(prev => {
      const next = [...prev];
      const [moved] = next.splice(src, 1);
      next.splice(dst, 0, moved);
      return next;
    });
    setHasOrderChanges(true);
  }

  async function saveOrder() {
    try {
      setButtonLoading(true)
      const ids = events.map(e => e.id);
      const res = await fetch('/api/admin/events/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      const data = await res.json();
      if (!res.ok){
        setSnackbarSettings((prev) => ({...prev,
          open: true,
          message: 'Event Reorder failed',
          severity: 'error'
        }))
        throw new Error(data?.error || 'Reorder failed')
      } else {
        setSnackbarSettings((prev) => ({...prev,
          open: true,
          message: 'Event Order Saved',
          severity: 'success'
        }))
      }
      setHasOrderChanges(false);
    } catch (e: unknown) {
      setSnackbarSettings((prev) => ({...prev,
        open: true,
        message: e instanceof Error ? e.message : 'Event Reorder failed',
        severity: 'error'
      }))
    }
    setButtonLoading(false)
  }

  useEffect(() => { 
      if (tab !== 0){
        fetchEventsForAdmin({ setEvents, setLoadingEvents })
      };
  }, [tab]);

  console.log('time', toUtcIso(publishAt), publishAt+':00.000Z')
  console.log('utctest', toLocalInputValue(toUtcIso(publishAt)))

  async function onSave() {
    try {
      if (title=='' || title == null){
        setSnackbarSettings((prev) => ({...prev,
          open: true,
          message: 'Title Needed',
          severity: 'error'
        }))
        return
      }

      setButtonLoading(true)

      let image_path: string | null = null;
      let image_url: string | null = null;

      const oldPath = (selectedEvent as EventType)?.image_path as string | undefined;

      if (imageFile) {
        const up = await uploadEventImage(imageFile, { oldPath });
        image_path = up.path;
        image_url = up.publicUrl; 
      } else {
        if (tab === 1 && eventId) {
          image_path = selectedEvent?.image_path ?? null;
          image_url  = selectedEvent?.image_url ?? null;
        }
      }

      const payload = {
        title, subheading, category, description,
        startDate: startDate || null,
        endDate: endDate||null,
        startTime: startTime||null,
        endTime: endTime||null,
        ctaLabel, ctaHref,
        image_path,
        image_url,
        published,
        publishAt:toUtcIso(publishAt) || null,
        unpublishAt: toUtcIso(unpublishAt) || null,
        hotspot_group: hotspotGroup,
      };

      let res, data;
      if (!eventId || tab === 0) {
        // CREATE
        res = await fetch('/api/admin/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        data = await res.json();
        if (!res.ok) {
          setSnackbarSettings((prev) => ({...prev,
            open: true,
            message: 'Event Creation failed',
            severity: 'error'
          }))
          throw new Error(data?.error || 'Create failed')
        } else {
          const raw = localStorage.getItem(DRAFT_KEY);
          const s = raw ? JSON.parse(raw) : {};
          localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...s, eventId: data.id }));
          if (tab === 0){
            setSnackbarSettings((prev) => ({...prev,
              open: true,
              message: 'Event Created Successfully',
              severity: 'success'
            }))
          };
        }

      } else {
        res = await fetch(`/api/admin/events/${eventId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        data = await res.json();
        if (!res.ok) {
          setSnackbarSettings((prev) => ({...prev,
            open: true,
            message: 'Event Update failed',
            severity: 'error'
          }))
          throw new Error(data?.error || 'Update failed')
        }else{
          setSnackbarSettings((prev) => ({...prev,
            open: true,
            message: 'Event Updated Successfully',
            severity: 'success'
          }))
        }
      }
      if (tab !== 0) fetchEventsForAdmin({ setEvents, setLoadingEvents });
      if (image_url) setImageUrl(image_url);
    } catch (e: unknown) {
        setSnackbarSettings((prev) => ({...prev,
          open: true,
          message: e instanceof Error ? e.message : 'Save failed',
          severity: 'error'
        }))
    }
    setButtonLoading(false)
    resetAll();
  }

  console.log(selectedEvent)
  console.log({hotspotGroup})

  async function onDelete(id: string) {
    setPendingDeleteId(id); 
    setSnackbarSettings({
      open: true,
      message: 'Are you sure you want to delete this event?',
      severity: 'warning',
      actionLabel: 'Delete',
      duration: 10000,
      actionCallback: async () => {
        try {
          const res = await fetch(`/api/admin/events/${id}`, { method: 'DELETE' });
          const data = await res.json();
          if (!res.ok) {
            setSnackbarSettings({
              open: true,
              message: 'Delete Event failed',
              severity: 'error',
            });
            throw new Error(data?.error || 'Delete failed');
          } else {
            setSnackbarSettings({
              open: true,
              message: 'Event Deleted Successfully',
              severity: 'success',
            });
            setEvents((prev) => prev.filter((e) => e.id !== id));
            if (eventId === id) {
              setEventId(null);
            }
          }
        } catch (e: unknown) {
          setSnackbarSettings({
            open: true,
            message: (e instanceof Error ? e.message : 'Delete failed'),
            severity: 'error',
          });
        } finally {
          setPendingDeleteId(null); 
        }
      },
    });
  }
  
  console.log('id', eventId)
  const dbEvents = events.map(e => ({
    id: e.id,
    imageUrl: e.image_url ?? undefined,
    title: e.title ?? '(untitled)',
    subheading: e.subheading ?? '',
    category: e.category ?? '',
    description: e.description ?? '',
    dateRange: formatDateRange(e.start_date, e.end_date),
    timeText: formatTimeRange(e.start_time, e.end_time),
    ctaLabel: e.cta_label ?? '',
    ctaHref: e.cta_href ?? '',
    hotspotGroup: e.hotspot_group ?? '',
  }));

  const formEvent = {
    id: eventId || 'new',
    imageUrl: imageUrl ?? undefined,
    title: title?.trim() || '(untitled)',
    subheading: subheading || '',
    category: category || '',
    description: description || '',
    dateRange: formatDateRange(startDate, endDate),
    timeText: formatTimeRange(startTime, endTime),
    ctaLabel: ctaLabel || '',
    ctaHref: ctaHref || '',
    hotspotGroup: hotspotGroup || '',
  };

  const hasFormContent =
    (title?.trim()?.length ?? 0) > 0 ||
    (subheading?.trim()?.length ?? 0) > 0 ||
    (category?.trim()?.length ?? 0) > 0 ||
    (description?.trim()?.length ?? 0) > 0 ||
    !!startDate || !!endDate || !!startTime || !!endTime ||
    (ctaLabel?.trim()?.length ?? 0) > 0 ||
    (ctaHref?.trim()?.length ?? 0) > 0 ||
    !!imageUrl || !!hotspotGroup;


  const previewEvents =
    tab === 0
      ? (hasFormContent ? [formEvent, ...dbEvents] : dbEvents)
      : (selectedUpdateId ? [formEvent] : dbEvents);

  const dateError =
    startDate && endDate && new Date(endDate) < new Date(startDate)
      ? 'End date cannot be before start date.'
      : '';

  const modalOpen = shouldShowModal({ publishModal, forceOpen, startDate, endDate });

  const canShowForm = tab === 0 || (tab === 1 && !!selectedUpdateId);

  useEffect(() => {
    if (tab === 0) resetAll();
  }, [tab])

  const filteredEvents = useMemo(() => applyFilter(events, filterTab, setDisableDrag), [ events, filterTab]);
  if (!mounted) return null;
  return (
    <div className="font-sans flex flex-col gap-4 md:flex-row min-h-screen md:h-screen p-8 md:gap-8 sm:px-20 bg-[#151c2f]">

      {/* editor side ni */}
      <div className="md:w-[30%] text-white h-[90%] md:overflow-scroll custom-scrollbar shadow-xl rounded-xl bg-[#212e3f] p-3 md:p-5 space-y-4">
        {/* tabs header */}
        <Box sx={{ borderBottom: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
          {
            profile?.role === 'super-admin' && (
              <div className='flex items-center py-2'>
                <button
                  onClick={()=> setOpenHotspotModal(true)}
                  className='bg-green-500 z-50 px-3 rounded-lg py-1 cursor-pointer hover:bg-green-700 duration-300 transition-all'
                >
                  Hotspot
                </button>
                <MainHotspotModal open={openHotspotModal} onClose={()=> setOpenHotspotModal(false)}/>
              </div>
            )
          }
          <Tabs
            value={tab}
            onChange={(_, v) => {
              setTab(v);
              resetAll();
              setSelectedUpdateId('')
              setEvents([])
              if (v === 0) setEventId(null);
            }}
            variant="fullWidth"
            sx={{
              '& .MuiTab-root': { color: 'rgba(255,255,255,0.7)' },
              '& .Mui-selected': { color: '#fff' },
              '& .MuiTabs-indicator': { backgroundColor: '#60a5fa' },
            }}
          >
            <Tab label="Create" />
            <Tab label="Update" />
          </Tabs>
        </Box>

        {tab === 1 && (
          <div className={`space-y-3 ${showUpdateView? 'hidden': ''}`}>
            <div className="flex items-center justify-between">
              <div className="px-2 text-sm text-white/80">Reorder events (drag rows)</div>
              <div className="flex items-center gap-2">
                <button
                  onClick={saveOrder}
                  disabled={buttonLoading || !hasOrderChanges}
                  className="rounded-md bg-blue-500/90 hover:bg-blue-500 px-3 py-1.5 text-sm disabled:opacity-50 hover:cursor-pointer disabled:cursor-not-allowed"
                >
                  {buttonLoading ? (
                    <span className="inline-flex items-center px-2 gap-2">
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4A4 4 0 004 12z"/>
                      </svg>
                    </span>
                  ) : (
                    'Save'
                  )}
                </button>
                <IconButton size="small"
                  onClick={()=>{
                    fetchEventsForAdmin({ setEvents, setLoadingEvents })
                    resetAll()
                  }}
                >
                  <RefreshIcon htmlColor="#9ca3af" fontSize="small" />
                </IconButton>
              </div>
            </div>
            <div>
              <Box sx={{ borderBottom: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
                <Tabs
                  value={filterTab}
                  onChange={(_, v) => {
                    setFilterTab(v);
                    console.log(v)
                  }}
                  variant="scrollable"
                  scrollButtons="auto"
                  allowScrollButtonsMobile
                  sx={{
                    '& .MuiTab-root': { color: 'rgba(255,255,255,0.7)',
                      fontSize: '12px',
                      // minWidth: 'auto',
                      px: 1.5,
                      textTransform: 'none',
                      whiteSpace: 'nowrap',
                     },
                    '& .Mui-selected': { color: '#67ff56' },
                    '& .MuiTabs-indicator': { backgroundColor: '#60fa68' },
                    '& .MuiTabs-scrollButtons.Mui-disabled': { opacity: 0.3 },
                  }}
                > 
                  <Tab label={`All`} />
                  <Tab label={`Live`} />
                  <Tab label={`Scheduled`} />
                  <Tab label={`Expired`}  />
                  <Tab label={`Hidden`} />
                </Tabs>
              </Box>
            </div>

            {loadingEvents ? (
              <div className="flex justify-center py-4"><CircularProgress size={20} /></div>
            ) : (
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="events-order" isDropDisabled={disableDrag}>
                  {(provided) => (
                    <ul
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="divide-y divide-white/10 rounded-lg h-[150px] md:h-[420px]  overflow-scroll custom-scrollbar"
                    >
                      {filteredEvents.map((e, index) => (
                        <Draggable key={e.id} draggableId={e.id} index={index} isDragDisabled={disableDrag} >
                          {(prov) => (
                            <li
                              ref={prov.innerRef}
                              {...prov.draggableProps}
                              className="flex items-center justify-between even:bg-[#151c2f] p-2  hover:bg-white/10"
                            >
                              <div className="flex items-center gap-3">
                                <span
                                  {...prov.dragHandleProps}
                                  className="text-white/60 cursor-grab active:cursor-grabbing"
                                  title="Drag to reorder"
                                >
                                  <DragIndicatorIcon fontSize="small" />
                                </span>
                                {/* <span className="w-6 text-white/60 text-xs tabular-nums">{index + 1}</span> */}
                                <span className="text-white hover:cursor-pointer truncate max-w-[70px] md:max-w-[150px]"
                                  onClick={()=>{
                                    const id = e.id
                                    const ev = events.find(x => x.id === id);
                                    console.log("here ev", ev)
                                    if (ev) {
                                      setEventId(ev.id);
                                      setTitle(ev.title || '');
                                      setSubheading(ev.subheading || '');
                                      setCategory(ev.category || '');
                                      setDescription(ev.description || '');
                                      setStartDate(ev.start_date || '');
                                      setEndDate(ev.end_date || '');
                                      setStartTime(ev.start_time || '');
                                      setEndTime(ev.end_time || '');
                                      setCtaLabel(ev.cta_label || '');
                                      setCtaHref(ev.cta_href || '');
                                      setImageUrl(ev.image_url || null);
                                      setPublished(!!ev.published);
                                      setPublishAt(toLocalInputValue(ev.publish_at) || '');
                                      setUnpublishAt(toLocalInputValue(ev.unpublish_at) || '');
                                      setHotspotGroup(ev.hotspot_group || '');
                                    }
                                    // console.log(e)
                                  }}
                                >{e.title || '(untitled)'}</span>
                              </div>
                              <span className="text-xs text-white/40">
                                <StatusPill status={e.computed_status ?? "hidden"}/>
                                <IconButton  aria-label="delete" onClick={() => {
                                      setShowUpdateView(true)
                                      setSelectedUpdateId(e.id)
                                      const id = e.id
                                      const ev = events.find(x => x.id === id);
                                      if (ev) {
                                        setEventId(ev.id);
                                        setTitle(ev.title || '');
                                        setSubheading(ev.subheading || '');
                                        setCategory(ev.category || '');
                                        setDescription(ev.description || '');
                                        setStartDate(ev.start_date || '');
                                        setEndDate(ev.end_date || '');
                                        setStartTime(ev.start_time || '');
                                        setEndTime(ev.end_time || '');
                                        setCtaLabel(ev.cta_label || '');
                                        setCtaHref(ev.cta_href || '');
                                        setImageUrl(ev.image_url || null);
                                        setPublished(ev.published ?? false);
                                        setPublishAt(toLocalInputValue(ev.publish_at) || '');
                                        setUnpublishAt(toLocalInputValue(ev.unpublish_at) || '');
                                        setHotspotGroup(ev.hotspot_group || '');
                                      }
                                    }
                                  }>
                                  <EditIcon className='text-green-400 hover:text-green-500 transition duration-700 ease-in-out' />
                                </IconButton>
                                <IconButton  aria-label="delete" onClick={() => {
                                    onDelete(e.id)
                                  }
                                }>
                                  <DeleteIcon className='text-red-400 hover:text-red-500 transition duration-700 ease-in-out' />
                                </IconButton>
                              </span>
                            </li>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      {events.length === 0 && (
                        <li className="p-3 text-sm text-white/60">No events yet.</li>
                      )}
                    </ul>
                  )}
                </Droppable>
              </DragDropContext>
            )}
          </div>
        )}

        {/* Update tab controls */}
        {showUpdateView && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <IconButton size="small" 
                onClick={()=>{
                  setSelectedUpdateId('')
                  resetAll()
                  fetchEventsForAdmin({ setEvents, setLoadingEvents })
                  }}
                  >
                  <div
                    className='border border-[rgba(255,255,255,0.1)] flex justify-center items-center p-2 rounded hover:bg-white/10 transition duration-300 ease-in-out'>
                    <ArrowBackOutlined htmlColor="#9ca3af" fontSize="small"
                    />
                  </div>
              </IconButton>
              <Select
                fullWidth
                displayEmpty
                size="small"
                value={selectedUpdateId}
                onChange={(e) => {
                  const id = String(e.target.value);
                  setSelectedUpdateId(id);
                  const ev = events.find(x => x.id === id);
                  // console.log("here ev", ev)
                  if (ev) {
                    setSelectedEvent(ev);
                    setEventId(ev.id);
                    setTitle(ev.title || '');
                    setSubheading(ev.subheading || '');
                    setCategory(ev.category || '');
                    setDescription(ev.description || '');
                    setStartDate(ev.start_date || '');
                    setEndDate(ev.end_date || '');
                    setStartTime(ev.start_time || '');
                    setEndTime(ev.end_time || '');
                    setCtaLabel(ev.cta_label || '');
                    setCtaHref(ev.cta_href || '');
                    setImageUrl(ev.image_url || null);
                    setPublished(!!ev.published);
                    setPublishAt(toLocalInputValue(ev.publish_at) || '');
                    setUnpublishAt(toLocalInputValue(ev.unpublish_at) || '');
                  }
                }}
                sx={{
                  color: '#fff',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.15)' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' },
                }}
                renderValue={(val) =>
                  val ? (events.find(e => e.id === val)?.title || '---') : 'Select event…'
                }
              >
                {loadingEvents && (
                  <MenuItem disabled>
                    <CircularProgress size={16} sx={{ mr: 1 }} /> Loading…
                  </MenuItem>
                )}
                {!loadingEvents && events.length === 0 && (
                  <MenuItem disabled>No events yet</MenuItem>
                )}
                {events.map(e => (
                  <MenuItem key={e.id} value={e.id}>
                    {e.title || '(untitled)'}
                  </MenuItem>
                ))}
              </Select>
            </div>
            <div className="text-xs text-white/60">
              {selectedUpdateId ? `Editing: ${selectedUpdateId}` : 'Pick an event to edit'}
            </div>
          </div>
        )}

        {canShowForm && (
          <div className='md:h-[85%] overflow-scroll custom-scrollbar'>
            <ImageDropzone
              imageUrl={imageUrl ?? undefined}
              onPickClick={onPickClick}
              onFileSelect={onFileSelect}
              onDrop={onDrop}
              onDragOver={onDragOver}
              inputRef={inputRef}
            />
            <div className='space-y-1 mt-2 pt-2'>
              <HotspotSelect value={hotspotGroup} onChange={setHotspotGroup} />
            </div>

            <div className="space-y-1 mt-2">
              <LabeledInput label="Exhibitor" value={title} onChange={setTitle} placeholder="Enter title" />
              <LabeledInput label="Booth" value={subheading} onChange={setSubheading} placeholder="e.g. Booth # 1..." />
              <LabeledInput label="Category" value={category} onChange={setCategory} placeholder="e.g. Accessories" />
              <LabeledTextarea label="Description" value={description} onChange={setDescription} placeholder="Write a short description..." rows={3} />
              <div className="text-xs text-white/60"><div className="text-end">{description.length} chars</div></div>
            </div>

            {/* <div className="grid grid-cols-2 gap-2">
              <LabeledDate label="Start date" value={startDate} onChange={setStartDate} />
              <LabeledDate label="End date" value={endDate} onChange={setEndDate} min={startDate || undefined} />
            </div> */}

            {/* <div className="grid grid-cols-2 mt-1 gap-2">
              <label className="block">
                <div className="text-sm mb-1 text-white/80">
                  Start time
                </div>
                <input
                  style={{ colorScheme: 'dark' }}
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
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
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full rounded-lg bg-[#131a2a] border border-white/10 px-3 py-2 outline-none focus:border-white/30"
                />
              </label>
            </div>
            {dateError && <div className="text-xs text-red-300">{dateError}</div>} */}

            <div className="grid grid-cols-2 mt-1 gap-2">
              <LabeledInput label="CTA label" value={ctaLabel} onChange={setCtaLabel} placeholder="Learn More" />
              <LabeledInput label="CTA link" value={ctaHref} onChange={setCtaHref} placeholder="https://example.com" />
            </div>

            <div className="mt-2 grid grid-cols-2 gap-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={published}
                  onChange={(e) => setPublished(e.target.checked)}
                />
                <div className="text-sm text-white/80">Published</div>
              </label>

              <div />
              {/* <label className="block">
                <div className="text-sm mb-1 text-white/80">Publish at</div>
                <input
                  style={{ colorScheme: 'dark' }}
                  type="datetime-local"
                  value={publishAt}
                  onChange={(e) => setPublishAt(e.target.value)}
                  className="w-full rounded-lg bg-[#131a2a] border border-white/10 px-3 py-2 outline-none focus:border-white/30"
                />
              </label>
              <label className="block">
                <div className="text-sm mb-1 text-white/80">Unpublish at</div>
                <input
                  style={{ colorScheme: 'dark' }}
                  type="datetime-local"
                  value={unpublishAt}
                  min={publishAt || undefined}
                  onChange={(e) => setUnpublishAt(e.target.value)}
                  className="w-full rounded-lg bg-[#131a2a] border border-white/10 px-3 py-2 outline-none focus:border-white/30"
                />
              </label> */}
            </div>

            <div className="flex gap-2 mt-1 pt-2">
              <button onClick={onSave} 
                disabled={!ready || buttonLoading}
                className="px-3 py-2 rounded-lg bg-green-400 hover:bg-green-500 hover:cursor-pointer text-black font-medium disabled:cursor-not-allowed">
                  {buttonLoading ? (
                    <span className="inline-flex items-center gap-2">
                      {tab === 0 || !eventId ? 'Creating…' : 'Updating…'}
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4A4 4 0 004 12z"/></svg>
                    </span>
                  ) : (
                    tab === 0 || !eventId ? 'Add Exhibit' : 'Update'
                  )}
              </button>
              <button onClick={clearForm} className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white hover:cursor-pointer">
                Clear
              </button>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT: live website preview + modal overlay */}
      <div className="md:w-[70%] h-[90%] md:overflow-scroll custom-scrollbar text-white shadow-xl rounded-xl bg-[#212e3f] gap-4 p-3 md:p-5">
        <div className="mb-2 text-sm text-white/60">Live preview from website</div>
        <div className="relative w-full h-[720px] md:h-full border border-white/10 bg-white rounded-xl overflow-hidden">
          <iframe ref={previewRef} src="/" title="Website Live Preview" className="absolute inset-0 object-contain h-full w-full" />
          <EventModalOverlay
            container="contained"
            open={modalOpen}
            onClose={() => {}}
            events={previewEvents}
            initialIndex={Math.max(0, previewEvents.findIndex(x => x.id === eventId))}
          />
        </div>

        <div className="mt-3 flex justify-between items-center border-t border-white/10 pt-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={publishModal} onChange={(e) => setPublishModal(e.target.checked)} />
            <span>Event popup modal (preview)</span>
          </label>
          {/* <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={forceOpen} onChange={(e) => setForceOpen(e.target.checked)} />
            <span>Force open in preview (ignore dates)</span>
          </label> */}
        </div>
      </div>
      <SnackbarComponent snackbarSettings={snackbarSettings} setSnackbarSettings={setSnackbarSettings}/>
    </div>
  );
}


