'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/EditOutlined';
import AddIcon from '@mui/icons-material/AddCircleOutline';

interface Hotspot {
  id: string;
  name: string;
  title: string;
  hotspot_logo?: string;
  created_at: string;
  updated_at: string;
}

interface HotspotModalProps {
  open: boolean;
  onClose: () => void;
}

export default function MainHotspotModal({ open, onClose }: HotspotModalProps) {
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [hotspotLogo, setHotspotLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchHotspots = async () => {
    const res = await fetch('/api/admin/hotspots');
    const data = await res.json();
    setHotspots(data);
  };

  useEffect(() => {
    if (open) fetchHotspots();
  }, [open]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setHotspotLogo(file);
    setLogoPreview(file ? URL.createObjectURL(file) : null);
  };

  const handleSubmit = async () => {
    if (!name.trim() || !title.trim()) return;
    setLoading(true);

    const formData = new FormData();
    formData.append('name', name);
    formData.append('title', title);
    if (hotspotLogo) formData.append('hotspot_logo', hotspotLogo);
    if (editingId) formData.append('id', editingId);

    await fetch('/api/admin/hotspots', {
      method: editingId ? 'PUT' : 'POST',
      body: formData,
    });

    await fetchHotspots();
    setName('');
    setTitle('');
    setHotspotLogo(null);
    setLogoPreview(null);
    setEditingId(null);
    setLoading(false);
  };

  const handleEdit = (hotspot: Hotspot) => {
    setEditingId(hotspot.id);
    setName(hotspot.name);
    setTitle(hotspot.title);
    setLogoPreview(hotspot.hotspot_logo || null);
  };

  const handleDelete = async (id: string) => {
    await fetch('/api/admin/hotspots', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    await fetchHotspots();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: '#151c2f',
          color: '#fff',
          borderRadius: 3,
          boxShadow: 6,
          padding: '1rem',
        },
      }}
    >
      <DialogTitle>Manage Hotspots</DialogTitle>

      <DialogContent className="max-h-[350px] overflow-y-scroll custom-scrollbar">
        <div className="flex flex-col gap-2 mb-4">
          <div className="flex flex-col md:flex-row gap-2">
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 px-3 py-2 rounded-md bg-[#1b2239] text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="flex-1 px-3 py-2 rounded-md bg-[#1b2239] text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* ✅ File input for hotspot_logo */}
          <div className="flex items-center gap-3 mt-2">
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoChange}
              className="text-sm text-gray-300"
            />
            {logoPreview && (
              <div className="relative w-12 h-12 rounded-md overflow-hidden border border-gray-600">
                <Image
                  src={logoPreview}
                  alt="Logo Preview"
                  fill
                  sizes="48px" // ✅ Added sizes prop
                  className="object-cover rounded-md"
                />
              </div>
            )}
          </div>

          <IconButton
            color="primary"
            onClick={handleSubmit}
            disabled={loading}
            className="!text-blue-400 hover:!text-blue-300 self-start mt-1"
          >
            <AddIcon />
          </IconButton>
        </div>

        {/* ✅ Hotspot list */}
        <List>
          {hotspots.length > 0 ? (
            hotspots.map((hotspot) => (
              <ListItem
                key={hotspot.id}
                sx={{
                  backgroundColor: '#1b2239',
                  borderRadius: 1,
                  mb: 1,
                }}
                secondaryAction={
                  <>
                    <IconButton edge="end" onClick={() => handleEdit(hotspot)}>
                      <EditIcon sx={{ color: '#89b4ff' }} />
                    </IconButton>
                    <IconButton edge="end" onClick={() => handleDelete(hotspot.id)}>
                      <DeleteIcon sx={{ color: '#ef4444' }} />
                    </IconButton>
                  </>
                }
              >
                <ListItemText
                  primary={
                    <div className="flex items-center gap-2">
                      {hotspot.hotspot_logo && (
                        <div className="relative w-8 h-8 rounded overflow-hidden">
                          <Image
                            src={hotspot.hotspot_logo}
                            alt={hotspot.title}
                            fill
                            sizes="32px" // ✅ Added sizes prop
                            className="object-cover rounded"
                          />
                        </div>
                      )}
                      <span>{hotspot.title}</span>
                    </div>
                  }
                  secondary={`Name: ${hotspot.name}`}
                  primaryTypographyProps={{ color: '#fff' }}
                  secondaryTypographyProps={{ color: '#a1a1aa' }}
                />
              </ListItem>
            ))
          ) : (
            <p className="text-gray-400 text-center mt-2">No hotspots found.</p>
          )}
        </List>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} sx={{ color: '#a5b4fc' }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}