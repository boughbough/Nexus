import React from 'react';
import { Upload } from 'lucide-react';

export default function DragDropOverlay({ isDragging }) {
  if (!isDragging) return null;

  return (
    <div className="absolute inset-0 z-[100] pointer-events-none flex items-center justify-center p-1 animate-fade-in">
      <div className="absolute inset-0 bg-primary/20 backdrop-blur-[2px] rounded-2xl" />
      
      <div className="relative w-full h-full border-2 border-dashed border-primary rounded-2xl flex items-center justify-center gap-3 bg-base-100/60 shadow-inner">
        <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center shadow-lg">
          <Upload size={18} strokeWidth={3} />
        </div>
        <div className="text-left">
          <h2 className="text-sm font-black text-primary uppercase tracking-tight">Lâchez pour envoyer</h2>
        </div>
      </div>
    </div>
  );
}