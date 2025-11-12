'use client';

import { useEffect } from 'react';

type Props = {
  open: boolean;
  onClose: () => void;
  url: string;
  title?: string;
};

export default function CTAModal({
  open,
  onClose,
  url,
  title,
}: Props) {
  useEffect(() => {
    if (!open) return;
    
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div 
      className="fixed inset-0 z-[60] flex items-center justify-center p-4" 
      role="dialog" 
      aria-modal="true"
    >
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm" 
        onClick={onClose} 
      />

      <div 
        className="relative z-10 w-full max-w-[95vw] h-[90vh] rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-neutral-50">
          <h3 className="text-lg font-semibold text-neutral-800 truncate pr-4">
            {title || 'Preview'}
          </h3>
          <div className="flex items-center gap-2">
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors duration-200 max-w-3xl truncate"
            >
              Open in New Tab
            </a>
            <button
              onClick={onClose}
              aria-label="Close"
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-200 hover:bg-neutral-300 text-neutral-700 transition-colors duration-200"
            >
              ×
            </button>
          </div>
        </div>

        <div className="flex-1 relative bg-white">
          <iframe
            src={url}
            title={title || 'Content Preview'}
            className="absolute inset-0 w-full h-full border-0"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-downloads"
            loading="lazy"
          />
        </div>
      </div>
    </div>
  );
}