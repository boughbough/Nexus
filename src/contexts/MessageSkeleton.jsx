import React from 'react';
export default function MessageSkeleton() {
  return (
    <div className="flex items-start gap-4 p-4 opacity-40">
      <div className="w-10 h-10 rounded-2xl skeleton-box shrink-0" />
      <div className="flex-1 space-y-3">
        <div className="h-3 w-24 rounded-lg skeleton-box" />
        <div className="space-y-2">
          <div className="h-3 w-full rounded-lg skeleton-box" />
          <div className="h-3 w-2/3 rounded-lg skeleton-box" />
        </div>
      </div>
    </div>
  );
}