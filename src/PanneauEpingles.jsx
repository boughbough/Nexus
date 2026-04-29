import React from 'react';
import { Pin, X, MessageCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function PanneauEpingles({
  epinglesPanel,
  setEpinglesPanel,
  messages,
  getAvatarUrl,
  allerAuMessage,
  salonActuel,
  togglePin,
  estModerateur,
  pseudo
}) {
  if (!epinglesPanel) return null;

  const messagesEpingles = messages.filter(m => m.pinned);

  return (
    <div className="w-80 bg-base-100 border-l border-base-300 flex flex-col shadow-2xl z-20 absolute right-0 top-0 h-full animate-fade-in">
      <div className="h-14 border-b border-base-200 flex items-center justify-between px-4 bg-base-100/50 backdrop-blur shrink-0">
        <div className="font-bold flex items-center gap-2">
          <Pin size={18} className="text-warning fill-warning/20" />
          Messages épinglés
        </div>
        <button onClick={() => setEpinglesPanel(false)} className="btn btn-ghost btn-sm btn-circle">
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-base-200/30">
        {messagesEpingles.length === 0 ? (
          <div className="text-center text-gray-500 my-auto flex flex-col items-center gap-3 opacity-50">
            <Pin size={48} />
            <p className="text-sm">Aucun message épinglé dans ce salon.</p>
          </div>
        ) : (
          messagesEpingles.map(msg => (
            <div key={msg.id} className="bg-base-100 rounded-xl shadow-sm border border-base-200 p-3 group relative hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <img src={getAvatarUrl(msg.username)} alt={msg.username} className="w-6 h-6 rounded-full object-cover" />
                <span className="font-bold text-sm">{msg.username}</span>
                <span className="text-[10px] text-gray-400 ml-auto">{new Date(msg.created_at).toLocaleDateString()}</span>
              </div>
              
              <div className="text-sm text-base-content/80 line-clamp-4 overflow-hidden mb-2">
                {msg.content ? (
                  <ReactMarkdown components={{ p: ({node, ...props}) => <span {...props} /> }}>
                    {msg.content}
                  </ReactMarkdown>
                ) : msg.image_url ? (
                   <span className="italic text-gray-400">[Fichier joint]</span>
                ) : null}
              </div>

              <div className="mt-2 flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => allerAuMessage(msg.id, salonActuel)} 
                  className="btn btn-xs btn-primary btn-outline"
                >
                  <MessageCircle size={12} /> Voir
                </button>
                {(estModerateur || msg.username === pseudo) && (
                  <button 
                    onClick={() => togglePin(msg.id, true)} 
                    className="btn btn-xs btn-error btn-outline"
                  >
                    Désépingler
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}