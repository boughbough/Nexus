import React, { useState, useEffect, useRef } from 'react';
import { Search, Hash, Compass } from 'lucide-react';

export default function QuickSwitcher({ servers, onSelectServer }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [isOpen]);

  const term = search.toLowerCase();
  
  const results = (servers || [])
    .filter(s => s.name && s.name.toLowerCase().includes(term))
    .slice(0, 8);

  const handleInputKeyDown = (e) => {
    if (results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      executerAction(results[selectedIndex]);
    }
  };

  const executerAction = (server) => {
    onSelectServer(server);
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1000] flex items-start justify-center pt-[15vh] px-4 animate-fade-in"
      onClick={() => setIsOpen(false)}
    >
      <div 
        className="bg-base-100 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-base-300 animate-[modalIn_0.15s_ease_forwards]"
        onClick={(e) => e.stopPropagation()} 
      >
        <div className="flex items-center px-6 border-b border-base-200">
          <Search size={24} className="text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            className="w-full bg-transparent text-xl p-5 focus:outline-none placeholder-base-content/30 text-base-content"
            placeholder="Rechercher un serveur..." 
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIndex(0); 
            }}
            onKeyDown={handleInputKeyDown}
          />
          <div className="flex gap-1 shrink-0">
            <kbd className="kbd kbd-sm bg-base-200 text-base-content/50">esc</kbd>
          </div>
        </div>

        <div className="max-h-[50vh] overflow-y-auto p-2">
          {results.length > 0 ? (
            results.map((server, idx) => (
              <div
                key={server.id}
                onClick={() => executerAction(server)}
                onMouseEnter={() => setSelectedIndex(idx)} 
                className={`flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-colors ${
                  idx === selectedIndex ? 'bg-primary text-primary-content shadow-md' : 'hover:bg-base-200/50 text-base-content'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${idx === selectedIndex ? 'bg-white/20 text-white' : 'bg-base-300 text-base-content/70'}`}>
                  <Hash size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`font-bold truncate ${idx === selectedIndex ? 'text-primary-content' : ''}`}>
                    {server.name}
                  </div>
                  <div className={`text-xs uppercase tracking-wider font-bold mt-0.5 ${idx === selectedIndex ? 'text-primary-content/70' : 'text-gray-400'}`}>
                    Serveur
                  </div>
                </div>
                {idx === selectedIndex && <kbd className="kbd kbd-sm bg-black/20 text-white border-none mx-2">↵</kbd>}
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-gray-500 flex flex-col items-center">
              <Compass size={40} className="mb-3 opacity-20" />
              <p>Aucun serveur trouvé pour "{search}"</p>
            </div>
          )}
        </div>
        
        <div className="bg-base-200/50 p-3 text-xs text-center text-base-content/50 border-t border-base-200 flex justify-center gap-6">
          <span><kbd className="kbd kbd-xs bg-base-300">↑</kbd> <kbd className="kbd kbd-xs bg-base-300">↓</kbd> pour naviguer</span>
          <span><kbd className="kbd kbd-xs bg-base-300">↵</kbd> pour rejoindre</span>
        </div>
      </div>
    </div>
  );
}