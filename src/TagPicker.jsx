import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';

const SUGGESTIONS = ["Gaming", "Dev", "Musique", "Chill", "Art", "Études", "Social", "Technologie"];

export default function TagPicker({ tags, setTags, maxTags = 5 }) {
  const [inputValue, setInputValue] = useState('');

  const ajouterTag = (tag) => {
    const propre = tag.trim().replace(/#/g, '');
    if (!propre) return;
    if (tags.length >= maxTags) return;
    if (tags.find(t => t.toLowerCase() === propre.toLowerCase())) return;
    
    setTags([...tags, propre]);
    setInputValue('');
  };

  const retirerTag = (tagASupprimer) => {
    setTags(tags.filter(t => t !== tagASupprimer));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      ajouterTag(inputValue);
    }
  };

  return (
    <div className="space-y-4">
      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
        Tags du serveur ({tags.length}/{maxTags})
      </label>

      <div className="flex flex-wrap gap-2">
        {tags.map(tag => (
          <div key={tag} className="badge badge-success gap-1.5 py-3.5 px-3 font-bold text-[11px] shadow-sm animate-fade-in border-0">
            #{tag}
            <button 
              onClick={() => retirerTag(tag)}
              className="hover:bg-black/10 rounded-full p-0.5 transition-colors"
            >
              <X size={12} />
            </button>
          </div>
        ))}
        
        {tags.length < maxTags && (
          <div className="relative flex-1 min-w-[150px]">
            <input 
              type="text" 
              placeholder="Ajouter un tag..." 
              className="input input-sm w-full bg-base-200/50 border-dashed focus:border-success focus:outline-none h-8 text-xs"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={() => ajouterTag(inputValue)}
            />
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {SUGGESTIONS.map(sug => {
          const estDejaSelectionne = tags.includes(sug);
          if (estDejaSelectionne) return null;
          return (
            <button 
              key={sug}
              onClick={() => tags.length < maxTags && ajouterTag(sug)}
              disabled={tags.length >= maxTags}
              className="btn btn-xs btn-ghost border border-base-300 border-dashed text-[10px] opacity-70 hover:opacity-100 hover:border-success hover:text-success disabled:opacity-30"
            >
              <Plus size={10} /> {sug}
            </button>
          );
        })}
      </div>
    </div>
  );
}