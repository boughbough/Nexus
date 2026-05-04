import React, { memo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import {ShieldAlert, Reply, Pin, Pencil, Trash, X, ArrowDown, FileText, FileVideo, File, Music } from 'lucide-react';
import LinkPreview from './LinkPreview';
import { useAuth } from './contexts/AuthContext';

const Spoiler = ({ texte }) => {
  const [estRevele, setEstRevele] = useState(false);
  
  return (
    <span 
      onClick={(e) => { 
        e.stopPropagation();
        setEstRevele(true); 
      }}
      className={`cursor-pointer rounded px-1.5 py-0.5 mx-0.5 transition-all duration-300 select-none ${
        estRevele 
          ? 'bg-black/20 text-inherit' 
          : 'bg-black/80 text-transparent hover:bg-black/60 relative overflow-hidden'
      }`}
      title={estRevele ? "" : "Cliquez pour révéler le spoiler"}
    >
      {texte}
    </span>
  );
};


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

const formaterDateSeparateur = (dateISO) => {
  const d = new Date(dateISO), auj = new Date(), hier = new Date();
  hier.setDate(auj.getDate() - 1);
  if (d.toDateString() === auj.toDateString()) return "Aujourd'hui";
  if (d.toDateString() === hier.toDateString()) return "Hier";
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
};

const estUtilisateurSupprime = (pseudo) => pseudo === '[supprimé]';

const surlignerTexte = (texte, query) => {
  if (!query?.trim() || !texte) return texte;
  const idx = texte.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return texte;
  return [texte.slice(0, idx), <mark key="m" className="bg-primary/30 text-base-content rounded px-0.5 font-bold">{texte.slice(idx, idx + query.length)}</mark>, texte.slice(idx + query.length)];
};

const getCleanFileName = (urlOrName) => {
  if (!urlOrName) return 'Fichier joint';
  try {
    const decoded = decodeURIComponent(urlOrName);
    const fullName = decoded.split('/').pop();
    const nameParts = fullName.split('-');
    if (nameParts.length > 1 && !isNaN(nameParts[0])) {
      return nameParts.slice(1).join('-');
    }
    return fullName;
  } catch (e) {
    return 'Fichier joint';
  }
};

const STATUTS = {
  en_ligne:  { label: 'En ligne',  dot: 'bg-success',  text: 'text-success',  ring: 'ring-success'  },
  occupe:    { label: 'Occupé',    dot: 'bg-warning',  text: 'text-warning',  ring: 'ring-warning'  },
  absent:    { label: 'Absent',    dot: 'bg-error',    text: 'text-error',    ring: 'ring-error'    },
  invisible: { label: 'Invisible', dot: 'bg-gray-400', text: 'text-gray-400', ring: 'ring-gray-400' },
};

const StatutDot = ({ statut, taille = 'w-2.5 h-2.5' }) => {
  if (!statut) return null;
  return <span className={`${taille} rounded-full border-2 border-base-100 ${STATUTS[statut]?.dot || 'bg-gray-400'} flex-shrink-0`} />;
};

const MessageItem = memo(({
  msg, messagePrecedent, monPseudoAffiche, statutAuteur, messageParent,
  estPremierNonLu, ligneNonLuRef, messagesRefsMap, messageEnEdition,
  texteEdition, setTexteEdition, sauvegarderModification, setMessageEnEdition,
  ouvrirMenuContextuel, gererClicProfil, allerAuMessage, salonActuel,
  rechercheQuery, toggleReaction, getAvatarUrlForDisplay
}) => {

  const { blockedUsers, blockedBy, profilsCache } = useAuth();
  const [showBlocked, setShowBlocked] = useState(false);

  const auteurId = msg.user_id || Object.values(profilsCache).find(p => p.pseudo === msg.username)?.id; 
  
  const jeLaiBloque = auteurId && blockedUsers?.includes(auteurId);
  let interactionInterdite = auteurId && (blockedUsers?.includes(auteurId) || blockedBy?.includes(auteurId));

  if (salonActuel?.startsWith('dm_')) {
    const ids = salonActuel.replace('dm_', '').split('_');
    const dmEstBloque = ids.some(id => blockedUsers?.includes(id) || blockedBy?.includes(id));
    if (dmEstBloque) {
      interactionInterdite = true;
    }
  }

  if (jeLaiBloque && !showBlocked) {
    return (
      <div className="flex items-center gap-3 px-6 py-2 my-1 bg-base-300/30 rounded-lg border border-dashed border-base-300 opacity-60 ml-12 w-fit">
        <ShieldAlert size={14} className="text-gray-500" />
        <span className="text-xs italic text-gray-500">Message d'un utilisateur bloqué</span>
        <button onClick={() => setShowBlocked(true)} className="text-[10px] uppercase font-bold text-base-content hover:underline ml-2">Afficher</button>
      </div>
    );
  }


  const isMyMessage = msg.username === monPseudoAffiche;
  const isEditingThis = messageEnEdition === msg.id;

  let afficherSeparateur = false;
  if (!messagePrecedent) afficherSeparateur = true;
  else if (new Date(messagePrecedent.created_at).toDateString() !== new Date(msg.created_at).toDateString()) afficherSeparateur = true;

  const reactionsGroupees = (msg.reactions || []).reduce((acc, r) => {
    if (!acc[r.emoji]) acc[r.emoji] = { count: 0, aReagi: false, users: [] };
    acc[r.emoji].count++;
    acc[r.emoji].users.push(r.username);
    if (r.username === monPseudoAffiche) acc[r.emoji].aReagi = true;
    return acc;
  }, {});

  const estSeulementEmojis = msg.content && !msg.image_url && !msg.reply_to_id &&
    /^(\s*(?:\p{Emoji_Presentation}|\p{Extended_Pictographic}|\p{Emoji}\uFE0F)\s*)+$/u.test(msg.content.trim());

  const estMediaSeul = msg.image_url && !msg.content && !msg.reply_to_id;
  const estMentionne = msg.mentions?.includes(monPseudoAffiche);


  const markdownComponents = React.useMemo(() => ({
    p: ({node, children, ...props}) => {
      const renderInlineEffects = (content) => {
        if (typeof content !== 'string') return content;
        const parts = content.split(/\|\|(.*?)\|\|/g);
        return parts.map((part, i) => {
          if (i % 2 === 1) {
            return <Spoiler key={`sp-${i}`} texte={part} />;
          }
          const mentionParts = part.split(/(@\w+)/g);
          return mentionParts.map((mPart, j) => {
            if (mPart.startsWith('@')) {
              const pseudoMention = mPart.slice(1);
              const estMoi = pseudoMention === monPseudoAffiche;
              return (
                <span key={`mt-${i}-${j}`} className={`inline-flex items-baseline rounded px-1 py-0.5 mx-0.5 transition-colors ${
                  estMoi 
                    ? 'bg-success/40 text-success-content ring-1 ring-success/50'
                    : isMyMessage 
                    ? 'bg-white/30 text-white shadow-sm' 
                    : 'text-primary bg-primary/10 hover:bg-primary/20'
                }`}>
                  <span className="opacity-70 font-medium">@</span>
                  <span className="font-black">{pseudoMention}</span>
                </span>
              );
            }
            return mPart;
          });
        });
      };
      return (
        <div className="mb-2 last:mb-0" {...props}>
          {React.Children.map(children, child => renderInlineEffects(child))}
        </div>
      );
    },
    a: ({node, ...props}) => <a className="text-primary hover:underline font-medium" target="_blank" rel="noopener noreferrer" {...props} />,
    code: ({node, inline, ...props}) => inline 
      ? <code className="bg-base-300 text-primary px-1.5 py-0.5 rounded text-sm font-mono" {...props} />
      : <code className="block bg-base-300 p-3 rounded-xl text-sm font-mono overflow-x-auto my-2 border border-base-200 shadow-inner" {...props} />
  }), [monPseudoAffiche, isMyMessage]);

  return (
    <div ref={el => { if (el) messagesRefsMap.current[msg.id] = el; else delete messagesRefsMap.current[msg.id]; }} className={`animate-message group w-full px-4 py-1 transition-colors ${messageEnEdition === msg.id ? 'bg-base-200/50' : ''}`}>
      {afficherSeparateur && <div className="divider text-xs font-bold text-gray-400 my-6">{formaterDateSeparateur(msg.created_at)}</div>}
      {estPremierNonLu && (
        <div ref={ligneNonLuRef} className="flex items-center gap-3 my-2">
          <div className="flex-1 h-px bg-error/60"></div>
          <span className="text-[11px] font-bold text-error/80 uppercase tracking-widest whitespace-nowrap select-none">Nouveaux messages</span>
          <div className="flex-1 h-px bg-error/60"></div>
        </div>
      )}
      <div className={`chat ${isMyMessage ? 'chat-end' : 'chat-start'} group`}>
        <div className={`chat-header text-sm mb-1 flex items-center gap-2 ${isMyMessage ? 'flex-row-reverse' : 'flex-row'}`}>
          <button onClick={(e) => gererClicProfil(e, msg.username)}
            className={`relative transition-transform ${!isMyMessage ? 'cursor-pointer hover:scale-110 hover:ring-2 hover:ring-primary rounded-full' : 'cursor-pointer'}`}>
            <img src={getAvatarUrlForDisplay(msg.username)} alt={msg.username} className="w-6 h-6 rounded-full shadow-sm object-cover" />
            {statutAuteur && <StatutDot statut={statutAuteur} taille="w-2 h-2 absolute -bottom-0.5 -right-0.5 border" />}
          </button>
          <span onClick={(e) => !estUtilisateurSupprime(msg.username) && gererClicProfil(e, msg.username)}
            className={`font-bold transition-colors ${estUtilisateurSupprime(msg.username) ? 'opacity-40 line-through text-xs cursor-default' : 'cursor-pointer hover:text-primary'}`}>
            {estUtilisateurSupprime(msg.username) ? 'Utilisateur supprimé' : msg.username}
          </span>
          <time className="text-xs opacity-50">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>
          {msg.updated_at && <span className="text-[10px] italic opacity-40 ml-1">(modifié)</span>}
          {msg.pinned && <div className="flex items-center gap-1 text-[10px] font-bold text-warning ml-2 bg-warning/10 px-1.5 py-0.5 rounded-md uppercase tracking-wider"><Pin size={10} className="fill-warning" /> Épinglé</div>}
        </div>

        {isEditingThis ? (
          <div className="flex gap-2 mt-1 items-center">
            <input type="text" className="input input-sm input-bordered bg-base-100" value={texteEdition} onChange={e => setTexteEdition(e.target.value)} onKeyDown={e => e.key === 'Enter' && sauvegarderModification(msg.id)} autoFocus />
            <button onClick={() => sauvegarderModification(msg.id)} className="btn btn-sm btn-success text-white">OK</button>
            <button onClick={() => setMessageEnEdition(null)} className="btn btn-sm btn-ghost">Annuler</button>
          </div>
        ) : (
          <div className={`chat-bubble flex flex-col gap-1 cursor-context-menu transition-transform ${
            (estSeulementEmojis || estMediaSeul)
              ? 'bg-transparent !shadow-none !p-0 leading-none'
              : `shadow-sm hover:brightness-95 ${
                  estMentionne 
                    ? 'bg-success/20 ring-1 ring-success/50 border-l-4 border-l-success !text-base-content' 
                    : (isMyMessage ? 'chat-bubble-primary' : 'bg-base-300 text-base-content')
                }`
          }`}
            onContextMenu={(e) => {
              if (interactionInterdite) {
                e.preventDefault();
                return;
              }
              if (ouvrirMenuContextuel) ouvrirMenuContextuel(e, msg);
            }}>
            {msg.reply_to_id && (
              <div
                onClick={() => messageParent && allerAuMessage(messageParent.id, salonActuel)}
                className={`text-xs px-3 py-2 mt-1 rounded-2xl flex items-start gap-2 shadow-sm transition-opacity ${messageParent ? 'cursor-pointer hover:opacity-75' : 'cursor-default'} ${isMyMessage ? 'bg-black/15 text-primary-content/90' : 'bg-base-100 text-base-content/80'}`}>
                <Reply size={12} className="mt-0.5 flex-shrink-0 opacity-70" />
                <div className="flex flex-col">
                  <span className="font-bold opacity-80 text-[11px] mb-0.5 uppercase tracking-wider">
                    {messageParent ? (messageParent.username === monPseudoAffiche ? "Vous" : (estUtilisateurSupprime(messageParent.username) ? 'Utilisateur supprimé' : messageParent.username)) : "Inconnu"}
                  </span>
                  <span className="truncate max-w-[200px] italic">{messageParent ? messageParent.content : "Message supprimé..."}</span>
                </div>
              </div>
            )}
            {msg.image_url && (
              msg.file_type && !msg.file_type.startsWith('image/') ? (
                msg.file_type.startsWith('video/') ? (
                  <video src={msg.image_url} controls className="max-w-xs rounded-lg my-1 border border-black/10" style={{maxHeight:'200px'}} />
                ) : (
                  <a 
                    href={`${msg.image_url}?download=${encodeURIComponent(getCleanFileName(msg.file_name || msg.image_url))}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl my-1 border transition-opacity hover:opacity-80 ${isMyMessage ? 'bg-black/15 border-white/10' : 'bg-base-100 border-base-300'}`}
                  >
                    {(() => { const Icon = getFileIcon(msg.file_type); return <Icon size={28} className={getFileColor(msg.file_type)} />; })()}
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate max-w-[180px]">
                        {getCleanFileName(msg.file_name || msg.image_url)}
                      </div>
                      <div className="text-[11px] opacity-60 uppercase">
                        {getCleanFileName(msg.file_name || msg.image_url).split('.').pop()}
                      </div>
                    </div>
                    <ArrowDown size={16} className="opacity-50 flex-shrink-0" />
                  </a>
                )
              ) : (
                <a href={msg.image_url} target="_blank" rel="noopener noreferrer">
                  <img src={msg.image_url} alt="Image partagée" className="max-w-xs rounded-lg my-1 hover:opacity-90 transition-opacity cursor-pointer border border-black/10 object-cover" />
                </a>
              )
            )}
            {msg.content && (
              estSeulementEmojis ? (
                <span style={{
                  lineHeight: 1.1, display: 'block',
                  fontSize: (() => {
                    const count = [...msg.content.trim()].length;
                    if (count === 1) return '56px';
                    if (count === 2) return '44px';
                    if (count === 3) return '36px';
                    if (count <= 6) return '28px';
                    return '22px';
                  })()
                }}>{msg.content}</span>
              ) : (
                <div className="text-[15px] leading-relaxed text-base-content/90 break-words">
                  {msg.content ? (
                    <>
                      <ReactMarkdown components={markdownComponents}>
                        {msg.content}
                      </ReactMarkdown>
                      
                      {(() => { 
                        const urlRegex = /(https?:\/\/[^\s]+)/g;
                        const urls = msg.content.match(urlRegex);
                        if (urls && urls.length > 0) {
                          return <LinkPreview url={urls[0]} />;
                        }
                        return null;
                      })()}
                    </>
                  ) : null}
                </div>
              )
            )}
          </div>
        )}

        {Object.keys(reactionsGroupees).length > 0 && (
          <div className={`flex gap-1 mt-1 ${isMyMessage ? 'justify-end' : 'justify-start'}`}>
            {Object.entries(reactionsGroupees).map(([emoji, data]) => {
              const tooltipText = data.aReagi
                ? `Vous${data.users.filter(u => u !== monPseudoAffiche).length > 0 ? ' et ' + data.users.filter(u => u !== monPseudoAffiche).join(', ') : ''} avez réagi`
                : data.users.join(', ') + (data.count === 1 ? ' a réagi' : ' ont réagi');
              return (
                <div key={emoji} className="reaction-wrapper relative">
<button 
  onClick={() => !interactionInterdite && toggleReaction(msg.id, emoji)} 
  className={`reaction-badge badge badge-sm transition-[background,color,border] duration-150 
    ${data.aReagi ? 'badge-primary badge-outline font-bold bg-primary/10' : 'badge-ghost bg-base-300'} 
    ${interactionInterdite ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:scale-110'}
  `}
>
  <span>{emoji}</span>
  {data.count > 1 && <span className="tabular-nums">{data.count}</span>}
</button>
                  <div className={`reaction-tooltip absolute ${isMyMessage ? 'right-0' : 'left-0'} bottom-full mb-2 z-50`}>
                    <div className="bg-base-content text-base-100 text-[11px] font-medium rounded-lg px-2.5 py-1.5 whitespace-nowrap shadow-lg max-w-[200px] truncate">{emoji} {tooltipText}</div>
                    <div className={`w-2 h-2 bg-base-content rotate-45 absolute -bottom-1 ${isMyMessage ? 'right-3' : 'left-3'}`}></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
});

export default MessageItem;