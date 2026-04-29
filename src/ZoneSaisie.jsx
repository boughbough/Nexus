import React from 'react';
import { VolumeX, Clock, ImagePlus, Loader2, Info, Smile, Send, Search, X, Reply, ArrowDown, FileVideo, Music, FileText, File } from 'lucide-react';
import EmojiPicker from './EmojiPicker';
import DragDropOverlay from './DragDropOverlay';
import { useUI } from './contexts/UIContext';

const getFileIcon = (fileType) => {
  if (!fileType) return File;
  if (fileType.startsWith('video/')) return FileVideo;
  if (fileType.startsWith('audio/')) return Music;
  if (fileType === 'application/pdf' || fileType.includes('word') || fileType.includes('document')) return FileText;
  return File;
};



const getFileColor = (fileType) => {
  if (!fileType) return 'text-gray-400';
  if (fileType.startsWith('video/')) return 'text-blue-400';
  if (fileType.startsWith('audio/')) return 'text-purple-400';
  if (fileType === 'application/pdf') return 'text-red-400';
  if (fileType.includes('word') || fileType.includes('document')) return 'text-blue-500';
  return 'text-gray-400';
};

const formatFileSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' o';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' Ko';
  return (bytes / (1024 * 1024)).toFixed(1) + ' Mo';
};

export default function ZoneSaisie({
  nouveauMessage, setNouveauMessage,
  reponseA, setReponseA,
  fichierPreview, setFichierPreview,
  isUploading,
  gifOuvert, setGifOuvert, gifQuery, setGifQuery, gifChargement, gifResultats, gifTendances,
  emojiOuvert, setEmojiOuvert,
  showAideFormat, aideFormatFermeture, toggleAideFormat,
  utilisateursEnTrain, dernierTexteTypingRef,

  placeholder,
  pseudoActuel,

  mentionsFiltrees,
  mentionMenuOuvert,
  mentionIndex,
  setMentionIndex,
  insererMention,
  fermerMenuMention,

  inputMessageRef, emojiTriggerRef, fichierInputRef,
  gererFrappe, envoyerMessage, envoyerFichier, confirmerEnvoiFichier,
  ouvrirGif, rechercherGifs, envoyerGif, insererEmoji,
  tempsRestantSlowmode,estMuet, mutedUntil,
}) {
  const [emojiFermeture, setEmojiFermeture] = React.useState(false);

  const { ajouterToast } = useUI();

  const verifierEtEnvoyerFichier = (files) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    const MAX_SIZE = 8 * 1024 * 1024;

    if (file.size > MAX_SIZE) {
      ajouterToast(`Fichier trop volumineux (${formatFileSize(file.size)}). La limite est de 8 Mo.`, 'error');
      if (fichierInputRef.current) fichierInputRef.current.value = '';
      return;
    }

    envoyerFichier({ target: { files: files } });
  };

  const fermerEmoji = () => {
    setEmojiFermeture(true);
    setTimeout(() => {
      setEmojiOuvert(false);
      setEmojiFermeture(false);
    }, 150);
  };

  const toggleEmoji = () => {
    if (emojiOuvert) {
      fermerEmoji();
    } else {
      setEmojiOuvert(true);
      setGifOuvert(false);
    }
  };

  const aideFormatRef = React.useRef(null);
  const aideFormatBtnRef = React.useRef(null);

    const gererTouche = (e) => {
    if (mentionMenuOuvert && mentionsFiltrees.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionIndex(prev => (prev + 1) % mentionsFiltrees.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionIndex(prev => (prev - 1 + mentionsFiltrees.length) % mentionsFiltrees.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        insererMention(mentionsFiltrees[mentionIndex].pseudo);
      } else if (e.key === 'Escape') {
        fermerMenuMention();
      }
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      if (tempsRestantSlowmode > 0) return; 
      
      if (fichierPreview) confirmerEnvoiFichier();
      else envoyerMessage();
    }
    
    if (e.key === 'Escape') {
      if (emojiOuvert) fermerEmoji();
      setGifOuvert(false);
    }
  };

  const gererColler = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) {
          verifierEtEnvoyerFichier([file]); 
          e.preventDefault(); 
          break;
        }
      }
    }
  };

  React.useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        showAideFormat && 
        aideFormatRef.current && !aideFormatRef.current.contains(e.target) &&
        aideFormatBtnRef.current && !aideFormatBtnRef.current.contains(e.target)
      ) {
        toggleAideFormat(); 
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showAideFormat, toggleAideFormat]);

  React.useEffect(() => {
    const handleGlobalDrop = (e) => {
      const files = e.detail.files;
      if (files && files.length > 0) {
        preparerFichier(files[0]);
      }
    };

    window.addEventListener('global-file-drop', handleGlobalDrop);
    return () => window.removeEventListener('global-file-drop', handleGlobalDrop);
  }, []);

  const [isDragging, setIsDragging] = React.useState(false);
  const dragCounter = React.useRef(0);

  React.useEffect(() => {
    const handleDragEnter = (e) => {
      e.preventDefault();
      dragCounter.current++;
      if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
        setIsDragging(true);
      }
    };

    const handleDragLeave = (e) => {
      e.preventDefault();
      dragCounter.current--;
      if (dragCounter.current === 0) setIsDragging(false);
    };

    const handleDrop = (e) => {
      e.preventDefault();
      setIsDragging(false);
      dragCounter.current = 0;

      verifierEtEnvoyerFichier(e.dataTransfer.files); 
    };

    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('dragover', (e) => e.preventDefault());
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('drop', handleDrop);
    };
  }, []);

  return (
    <>
      {(() => {
        const visible = utilisateursEnTrain.length > 0;
        return (
          <div style={{ maxHeight: visible ? '28px' : '0px', opacity: visible ? 1 : 0, transition: 'max-height 0.25s cubic-bezier(0.4,0,0.2,1), opacity 0.2s ease', overflow: 'hidden' }} className="bg-base-200 px-5 border-t border-base-300 z-10 relative">
            <div className="flex items-center gap-2 text-xs text-gray-400 font-medium h-7">
              <span className="flex gap-[3px] items-end pb-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{animationDelay:'0ms',animationDuration:'0.9s'}}></span>
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{animationDelay:'160ms',animationDuration:'0.9s'}}></span>
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{animationDelay:'320ms',animationDuration:'0.9s'}}></span>
              </span>
              
              <span style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(4px)', transition: 'opacity 0.2s ease 0.05s, transform 0.2s ease 0.05s' }}>
                {utilisateursEnTrain.length > 0 ? `${utilisateursEnTrain.join(', ')} ${utilisateursEnTrain.length > 1 ? 'écrivent' : 'écrit'}...` : ''}
              </span>

            </div>
          </div>
        );
      })()}

      <div className="p-4 bg-base-200 flex flex-col gap-2 shadow-inner z-10 relative">
        <DragDropOverlay isDragging={isDragging} />
        {fichierPreview && (
          <div className="bg-base-100 rounded-xl border border-base-300 p-3 flex items-center gap-3 animate-[toastIn_0.2s_ease_forwards]">
            {fichierPreview.type.startsWith('image/') ? (
              <img src={fichierPreview.url} className="w-14 h-14 rounded-lg object-cover flex-shrink-0 border border-base-300" />
            ) : fichierPreview.type.startsWith('video/') ? (
              <video src={fichierPreview.url} className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
            ) : (
              <div className="w-14 h-14 rounded-lg bg-base-200 flex items-center justify-center flex-shrink-0">
                {(() => { const Icon = getFileIcon(fichierPreview.type); return <Icon size={28} className={getFileColor(fichierPreview.type)} />; })()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{fichierPreview.file.name}</div>
              <div className="text-xs text-gray-400">{formatFileSize(fichierPreview.file.size)}</div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={() => { URL.revokeObjectURL(fichierPreview.url); setFichierPreview(null); }} className="btn btn-ghost btn-sm btn-circle text-error"><X size={16}/></button>
              
            </div>
          </div>
        )}

        {reponseA && (
          <div className="bg-base-100 p-2 text-sm flex items-center justify-between rounded-lg border border-primary/30 shadow-sm">
            <div className="flex gap-2 items-center overflow-hidden">
              <Reply size={16} className="text-primary flex-shrink-0" />
              <span className="font-bold text-primary flex-shrink-0">En réponse à {reponseA.username === pseudoActuel ? "vous-même" : reponseA.username} :</span>
              <span className="text-gray-500 italic truncate max-w-sm">{reponseA.content}</span>
            </div>
            <button onClick={() => setReponseA(null)} className="btn btn-ghost btn-xs text-gray-400 hover:text-error ml-2 flex-shrink-0"><X size={16}/></button>
          </div>
        )}

        {gifOuvert && (
          <div className="bg-base-100 border border-base-300 rounded-xl shadow-xl mb-2 overflow-hidden" style={{height: '280px'}}>
            <div className="p-2 border-b border-base-200 flex gap-2 items-center">
              <div className="relative flex-1">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input autoFocus type="text" placeholder="Rechercher un GIF…" className="input input-bordered input-sm w-full pl-8 text-sm" value={gifQuery} onChange={e => rechercherGifs(e.target.value)} onKeyDown={e => e.key === 'Escape' && setGifOuvert(false)} />
              </div>
              <button onClick={() => setGifOuvert(false)} className="btn btn-ghost btn-xs btn-circle text-gray-400"><X size={14}/></button>
            </div>
            <div className="overflow-y-auto h-[232px] p-2">
              {gifChargement ? (
                <div className="flex justify-center items-center h-full"><Loader2 size={20} className="animate-spin text-gray-400" /></div>
              ) : (
                <div className="columns-3 gap-1.5 space-y-1.5">
                  {(gifQuery ? gifResultats : gifTendances).map(gif => {
                    const url = gif.images?.fixed_height_small?.url || gif.images?.original?.url;
                    if (!url) return null;

                    return (
                      <button 
                        key={gif.id} 
                        onClick={() => envoyerGif(gif)} 
                        className="w-full rounded-lg overflow-hidden hover:opacity-80 transition-opacity hover:scale-[1.02] transition-transform block bg-base-300 min-h-[60px]"
                      >
                        <img 
                          src={url} 
                          alt={gif.title} 
                          className="w-full object-cover rounded-lg" 
                          loading="lazy" 
                        />
                      </button>
                    );
                  })}
                  {(gifQuery ? gifResultats : gifTendances).length === 0 && !gifChargement && (
                    <div className="col-span-3 text-center text-xs text-gray-400 py-8">Aucun GIF trouvé</div>
                  )}
                </div>
              )}
            </div>
            <div className="text-[9px] text-gray-400 text-right px-2 pb-1">Powered by GIPHY</div>
          </div>
        )}

        {mentionMenuOuvert && (
          <div className="absolute bottom-[80px] left-4 mb-2 w-64 bg-base-100 border border-base-300 shadow-2xl rounded-xl overflow-hidden z-[100] animate-[modalIn_0.15s_ease_forwards] origin-bottom-left">
            <div className="px-3 py-2 bg-base-200 text-[10px] font-black uppercase tracking-widest text-gray-500">Mentionner</div>
            <div className="max-h-48 overflow-y-auto p-1">
              {mentionsFiltrees.map((m, index) => (
                <button key={m.pseudo} onClick={() => insererMention(m.pseudo)} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm font-bold text-left ${index === mentionIndex ? 'bg-primary/20 text-primary' : 'hover:bg-primary/10 hover:text-primary'}`}>
                  <img src={m.avatar_url || `https://ui-avatars.com/api/?name=${m.pseudo}&background=random&rounded=true&size=32`} className="w-6 h-6 rounded-full object-cover shadow-sm" />
                  <span className="truncate">{m.pseudo}</span>
                </button>
              ))}
              {mentionsFiltrees.length === 0 && <div className="p-3 text-xs text-center text-gray-500 italic">Aucun résultat</div>}
            </div>
          </div>
        )}

        <div className="flex gap-2 items-center">
          <input type="file" className="hidden" ref={fichierInputRef} onChange={(e) => verifierEtEnvoyerFichier(e.target.files)} />
          <button onClick={() => fichierInputRef.current.click()} disabled={isUploading} className="btn btn-ghost btn-circle text-gray-500 hover:text-primary" title="Fichier / Image">
            {isUploading ? <Loader2 size={24} className="animate-spin" /> : <ImagePlus size={24} />}
          </button>
          <button onClick={ouvrirGif} className={`btn btn-ghost btn-circle text-sm font-bold transition-colors ${gifOuvert ? 'text-primary bg-primary/10' : 'text-gray-500 hover:text-primary'}`} title="GIF">
            GIF
          </button>
          

          <div className="relative flex-shrink-0">
            <button 
              ref={aideFormatBtnRef} 
              onClick={toggleAideFormat}
              className={`btn btn-ghost btn-circle transition-colors ${showAideFormat ? 'text-primary bg-primary/10' : 'text-gray-500 hover:text-primary'}`} title="Aide formatage">
              <Info size={22} />
            </button>
            {showAideFormat && (
              <div ref={aideFormatRef} className={`absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-64 bg-base-100 border border-base-300 rounded-2xl shadow-[0_20px_50px_-10px_rgba(0,0,0,0.4)] p-4 z-50 ${aideFormatFermeture ? 'format-exit' : 'format-enter'}`}>
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Formatage</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center bg-base-200/50 p-1.5 rounded-lg"><code>**gras**</code> <span className="font-bold">Gras</span></div>
                  <div className="flex justify-between items-center bg-base-200/50 p-1.5 rounded-lg"><code>*italique*</code> <span className="italic">Italique</span></div>
                  <div className="flex justify-between items-center bg-base-200/50 p-1.5 rounded-lg"><code>`code`</code> <code className="bg-base-300 px-1 rounded text-primary text-[10px]">Inline</code></div>
                  <div className="flex flex-col gap-1 bg-base-200/50 p-1.5 rounded-lg">
                      <code className="text-[10px]">```bloc code```</code>
                      <div className="bg-base-300 p-1 rounded text-[9px] font-mono text-gray-500">Bloc de code</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="relative flex-shrink-0">
          <button ref={emojiTriggerRef} onClick={toggleEmoji} className={`btn btn-ghost btn-circle transition-colors ${emojiOuvert ? 'text-primary bg-primary/10' : 'text-gray-500 hover:text-primary'}`} title="Emoji">
            <Smile size={22} />
          </button>

          {emojiOuvert && (
            <div className="absolute bottom-full left-0 mb-2 z-50">
              <EmojiPicker 
                triggerRef={emojiTriggerRef} 
                onSelect={(emoji) => insererEmoji(emoji)} 
                onClose={fermerEmoji} 
                isClosing={emojiFermeture} 
              />
            </div>
          )}
                    </div>
                    
          <input 
            ref={inputMessageRef} 
            type="text" 
            className={`input input-bordered flex-1 shadow-sm transition-all ${estMuet ? 'bg-base-200/50 cursor-not-allowed opacity-60' : ''}`} 
            
            placeholder={estMuet ? `🔇 Vous êtes muet jusqu'à ${new Date(mutedUntil).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}` : (tempsRestantSlowmode > 0 ? `Mode lent : attendez ${tempsRestantSlowmode}s...` : placeholder)} 
            
            value={nouveauMessage} 
            onChange={gererFrappe} 
            onKeyDown={gererTouche} 
            onPaste={gererColler}
            disabled={estMuet}
          />
          
          {tempsRestantSlowmode > 0 ? (
            <div className="flex items-center gap-1.5 px-4 h-12 bg-primary/15 border border-primary/30 text-primary rounded-lg font-bold text-sm shrink-0 cursor-not-allowed select-none">
              <Clock size={18} className="animate-pulse" />
              {tempsRestantSlowmode}s
            </div>
          ) : (
            <button 
              onClick={() => { if (!fichierPreview) envoyerMessage(); else confirmerEnvoiFichier(); }} 
              disabled={isUploading || estMuet}
              className="btn btn-primary shadow-sm transition-all shrink-0"
            >
              {isUploading ? <Loader2 size={20} className="animate-spin" /> : (estMuet ? <VolumeX size={20} /> : <Send size={20} />)}
            </button>
          )}
        </div>
      </div>
    </>
  );
}