import React, { useState, useRef, useEffect } from 'react';
import { MessagesSquare , MessageCircle, Users, X, Settings, LogOut } from 'lucide-react';
import { useAuth } from './contexts/AuthContext';
import { useUI } from './contexts/UIContext';
import { supabase } from './supabase';

const STATUTS = {
  en_ligne:  { label: 'En ligne',  dot: 'bg-success',  text: 'text-success' },
  occupe:    { label: 'Occupé',    dot: 'bg-warning',  text: 'text-warning' },
  absent:    { label: 'Absent',    dot: 'bg-error',    text: 'text-error'   },
  invisible: { label: 'Invisible', dot: 'bg-gray-400', text: 'text-gray-400'},
};

const StatutDot = ({ statut, taille = 'w-2.5 h-2.5' }) => {
  if (!statut) return null;
  return <span className={`${taille} rounded-full border-2 border-base-100 ${STATUTS[statut]?.dot || 'bg-gray-400'} flex-shrink-0`} />;
};

export default function SidebarDMs({
  salonActuel,
  changerSalon,
  vueActive,
  demandesAmis,
  salonsPrives,

  getAvatarUrlForDisplay,
  notifications,
  supprimerSalonDM,
  ouvrirParametres,
  demanderConfirmation,
  seDeconnecter
}) {

  const { session, monProfil, pseudo: monPseudoAffiche, profilsCache, utilisateursEnLigne, getStatutEffectif } = useAuth();

  const [menuStatutOuvert, setMenuStatutOuvert] = useState(false);
  const menuStatutRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuStatutRef.current && !menuStatutRef.current.contains(event.target)) {
        setMenuStatutOuvert(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const changerStatut = async (nouveauStatut) => {
    setMenuStatutOuvert(false);
    if (session?.user?.id) {
      await supabase.from('profiles').update({ statut: nouveauStatut }).eq('id', session.user.id);
    }
  };

  const monPseudoTech = session?.user?.email?.split('@')[0];
  const { menuMobileOuvert, fermerMenuMobile } = useUI();

  return (
   <div className={`w-64 bg-base-300 flex flex-col border-r border-base-100 absolute md:relative z-[110] h-full transition-transform duration-300 md:translate-x-0 ${menuMobileOuvert ? 'translate-x-[72px]' : '-translate-x-full'}`}>
      <div className="p-4 font-bold text-xl border-b border-base-100 flex items-center gap-2">
        <MessagesSquare size={24} className="text-primary"/> Messages
      </div>
      
      <div className="flex-1 overflow-y-auto flex flex-col">
        <div className="p-3 pb-2 border-b border-base-200/60">
          <button
            onClick={() => { changerSalon(''); fermerMenuMobile(); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${salonActuel === '' && vueActive === 'chat' ? 'bg-primary text-primary-content font-bold shadow-md' : 'hover:bg-base-200 text-gray-500 hover:text-base-content'}`}
          >
            <Users size={18} className={salonActuel === '' ? 'text-primary-content' : 'text-gray-400'} />
            <span className="flex-1 text-left">Amis</span>
            {demandesAmis.length > 0 && (
              <span className="badge badge-error badge-sm text-[10px] text-white font-bold shadow-sm border-0">{demandesAmis.length}</span>
            )}
          </button>
        </div>

        {salonsPrives.length > 0 && (
          <div className="p-3 pt-3">
            <h2 className="text-[11px] font-bold text-gray-400 mb-2 uppercase tracking-wider px-2">Messages Privés</h2>
            <ul className="menu bg-base-300 w-full p-0">
              {salonsPrives.map(contactId => {
  const room = `dm_${[session.user.id, contactId].sort().join('_')}`;
  
  const profil = profilsCache[contactId];
  const displayContact = profil?.pseudo || "Utilisateur";
  const statut = getStatutEffectif(profil?.pseudo || '', profil);
  const estSupprime = !profil;
  const isActive = salonActuel === room && vueActive === 'chat';
  
  return (
    <li key={contactId} className="group/dm relative">
      <a 
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors pr-8 ${isActive ? "bg-primary text-primary-content font-bold shadow-md" : "hover:bg-base-200 text-gray-500 hover:text-base-content"}`} 
        onClick={() => { changerSalon(room); fermerMenuMobile(); }}
      >
        <div className="relative flex-shrink-0">
          <img src={getAvatarUrlForDisplay(displayContact)} alt={displayContact} className="w-8 h-8 rounded-full object-cover" />
          {statut && <StatutDot statut={statut} taille="w-2.5 h-2.5 absolute -bottom-0.5 -right-0.5 border" />}
        </div>
        
        <div className="flex-1 min-w-0">
          <span className={`truncate block font-medium ${estSupprime ? 'opacity-60 italic' : ''}`}>
            {displayContact}
          </span>
        </div>
        
        {notifications[room] > 0 && (
          <div className="badge badge-error badge-sm text-[10px] font-bold text-white shadow-sm border-0">
            {notifications[room]}
          </div>
        )}
      </a>
      <button
        onClick={(e) => { e.stopPropagation(); supprimerSalonDM(contactId); }}
        className={`absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded-md opacity-0 group-hover/dm:opacity-100 transition-opacity ${isActive ? 'text-primary-content/60 hover:text-primary-content' : 'text-gray-400 hover:text-error'}`}
        title="Fermer la conversation"
      >
        <X size={13} />
      </button>
    </li>
  );
})}
            </ul>
          </div>
        )}
      </div>
      
      <div className="p-3 border-t border-base-100 bg-base-200 flex items-center gap-2 mt-auto w-full">
        <div className="flex items-center gap-2 flex-1 min-w-0 rounded-lg px-2 py-1.5 group">
          
          <div 
            className="relative flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity" 
            ref={menuStatutRef}
            onClick={() => setMenuStatutOuvert(!menuStatutOuvert)}
          >
            <img src={getAvatarUrlForDisplay(monPseudoAffiche)} alt="Moi" className="w-8 h-8 rounded-full object-cover" />
            {monProfil?.statut !== 'invisible' && <StatutDot statut={monProfil?.statut || 'en_ligne'} taille="w-2.5 h-2.5 absolute -bottom-0.5 -right-0.5 border" />}

            {menuStatutOuvert && (
              <div className="absolute bottom-full left-0 mb-3 w-48 bg-base-100 border border-base-300 rounded-xl shadow-[0_15px_40px_-10px_rgba(0,0,0,0.3)] p-1.5 z-[100] animate-[modalIn_0.15s_ease_forwards] origin-bottom-left cursor-default" onClick={e => e.stopPropagation()}>
                <div className="px-2 py-1.5 mb-1 text-[10px] font-black uppercase tracking-widest text-gray-500 border-b border-base-200">
                  Définir un statut
                </div>
                {Object.entries(STATUTS).map(([key, data]) => (
                  <button
                    key={key}
                    onClick={() => changerStatut(key)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-bold transition-all hover:bg-base-200/60 hover:pl-4 ${monProfil?.statut === key ? 'bg-primary/10 text-primary' : 'text-base-content'}`}
                  >
                    <span className={`w-3 h-3 rounded-full border border-base-100 ${data.dot}`}></span>
                    <span>{data.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="min-w-0 text-left flex-1">
            <div className="text-sm font-bold truncate">{monPseudoAffiche}</div>
            <div className={`text-[10px] font-medium ${STATUTS[monProfil?.statut || 'en_ligne']?.text}`}>
              {STATUTS[monProfil?.statut || 'en_ligne']?.label}
            </div>
          </div>
          <button onClick={ouvrirParametres} className="flex-shrink-0 p-1.5 rounded-md text-gray-400 hover:text-base-content hover:bg-base-300 transition-colors cursor-pointer" title="Paramètres">
            <Settings size={16} />
          </button>
        </div>
        <button onClick={() => demanderConfirmation("Se déconnecter ?", seDeconnecter, false)}
          className="btn btn-ghost btn-sm btn-circle text-error opacity-60 hover:opacity-100 flex-shrink-0" title="Se déconnecter">
          <LogOut size={15} />
        </button>
      </div>
    </div>
  );
}