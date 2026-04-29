import React, { useState, useEffect } from 'react';
import { ExternalLink, Link as LinkIcon, Play } from 'lucide-react';

const getYouTubeId = (url) => {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:.*v=|.*\/|shorts\/))([^"&?\/\s]{11})/);
  return match ? match[1] : null;
};

export default function LinkPreview({ url }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const ytId = getYouTubeId(url);
  const isYouTube = !!ytId;

  useEffect(() => {
    if (!url) return;
    const cached = sessionStorage.getItem(`preview-${url}`);
    if (cached) {
      setData(JSON.parse(cached));
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(false);

    fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}`)
      .then(res => res.json())
      .then(res => {
        if (res.status === 'success' && (res.data.title || res.data.image || res.data.publisher)) {
          if (ytId && !res.data.image) {
            res.data.image = { url: `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg` };
          }
          sessionStorage.setItem(`preview-${url}`, JSON.stringify(res.data));
          setData(res.data);
        } else if (ytId) {
          const fallbackYT = {
            title: "Vidéo YouTube",
            publisher: "YouTube",
            image: { url: `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg` }
          };
          sessionStorage.setItem(`preview-${url}`, JSON.stringify(fallbackYT));
          setData(fallbackYT);
        } else {
          setError(true);
        }
      })
      .catch(() => {
        if (ytId) {
          setData({
            title: "Vidéo YouTube",
            publisher: "YouTube",
            image: { url: `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg` }
          });
        } else {
          setError(true);
        }
      })
      .finally(() => setLoading(false));
  }, [url, ytId]);

  if (loading) {
    return (
      <div className="mt-3 flex flex-col sm:flex-row border border-base-300 rounded-xl overflow-hidden bg-base-200/20 max-w-lg animate-pulse">
        <div className="w-full sm:w-32 h-32 bg-base-300" />
        <div className="p-4 flex-1 space-y-2">
          <div className="h-2 w-20 bg-base-300 rounded" />
          <div className="h-4 w-full bg-base-300 rounded" />
          <div className="h-3 w-2/3 bg-base-300 rounded" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    try {
      const urlObj = new URL(url);
      return (
        <a href={url} target="_blank" rel="noopener noreferrer"
           className="mt-3 flex items-center gap-3 p-3 border border-base-300 rounded-xl bg-base-200/30 hover:bg-base-200/80 transition-all max-w-lg no-underline group shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-base-300 flex items-center justify-center text-white/50 group-hover:text-primary transition-colors">
                <LinkIcon size={18} />
            </div>
            <div className="flex-1 min-w-0">
                 <div className="font-black text-sm text-white truncate transition-colors">
                    {urlObj.hostname.replace('www.', '')}
                 </div>
                 <div className="text-xs text-white/40 truncate">Lien externe</div>
            </div>
        </a>
      );
    } catch (e) {
      return null; 
    }
  }

  return (
    <a 
      href={url} 
      target="_blank" 
      rel="noopener noreferrer" 
      className="mt-3 flex flex-col sm:flex-row border border-base-300 rounded-xl overflow-hidden bg-base-200/30 hover:bg-base-200/80 transition-all max-w-lg no-underline group shadow-sm hover:shadow-md"
    >
      {data.image && (
        <div className={`w-full sm:w-32 h-32 flex-shrink-0 bg-base-300 overflow-hidden relative ${isYouTube ? 'bg-black' : ''}`}>
          <img 
            src={data.image.url} 
            alt={data.title || "Aperçu du lien"} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
             {isYouTube ? (
               <Play size={32} className="text-white opacity-80 group-hover:opacity-100 transition-opacity drop-shadow-md" fill="currentColor" />
             ) : (
               <ExternalLink size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
             )}
          </div>
        </div>
      )}
      <div className="p-3 flex flex-col justify-center min-w-0 flex-1">
        <div className="text-[10px] font-black uppercase tracking-widest mb-1 truncate flex items-center gap-1.5 text-white/70">
          {data.publisher || new URL(url).hostname.replace('www.', '')}
        </div>
        
        <div className="font-black text-sm leading-tight mb-1.5 text-white transition-colors line-clamp-2">
          {data.title || url}
        </div>

        {data.description && (
          <div className="text-xs text-white/50 line-clamp-2 leading-relaxed italic">
            {data.description}
          </div>
        )}
      </div>
    </a>
  );
}