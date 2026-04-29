import React, { useState } from 'react';
import { UserX, VolumeX, MessageCircle, UserPlus, ShieldAlert } from 'lucide-react';
import { supabase } from './supabase';
import { useAuth } from './contexts/AuthContext';

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

export default function ProfilPopover({
  profilPopover, setProfilPopover, getAvatarUrlForDisplay, getStatutEffectif, demarrerDM, session, amis, demandesAmis, ajouterToast
}) {
  const { blockedUsers, chargerBlocages } = useAuth(); 

  const [showMuteOptions, setShowMuteOptions] = useState(false);
  const [customMute, setCustomMute] = useState('');
  const [showBanConfirm, setShowBanConfirm] = useState(false);

  if (!profilPopover) return null;

  const handleAjouterAmi = async () => {
    await supabase.from('friendships').insert({ requester_id: session.user.id, receiver_id: profilPopover.profil.id, status: 'pending' });
    setProfilPopover(null);
    ajouterToast("Demande envoyée !");
  };

  const handleToggleBlock = async () => {
    const targetId = profilPopover.profil?.id;
    if (!targetId) return;
    const estDejaBloque = blockedUsers.includes(targetId);

    if (estDejaBloque) {
      await supabase.from('blocked_users').delete().match({ blocker_id: session.user.id, blocked_id: targetId });
      ajouterToast("Utilisateur débloqué", "success");
    } else {
      await supabase.from('blocked_users').insert({ blocker_id: session.user.id, blocked_id: targetId });
      ajouterToast("Utilisateur bloqué", "success");
    }
    chargerBlocages();
    setProfilPopover(null);
  };

  const statut = getStatutEffectif(profilPopover.username, profilPopover.profil);

  const estModerateur = profilPopover.serverProps?.estModerateur;
  const muter = profilPopover.serverProps?.muterUtilisateur;
  const bannir = profilPopover.serverProps?.bannirUtilisateur;


  return (
    <>
      <div className="fixed inset-0 z-40 backdrop-blur-[2px]" onClick={() => setProfilPopover(null)} />
      <div className="popover-appear fixed z-50 bg-base-100 rounded-xl shadow-2xl border border-base-200 w-56 overflow-y-auto overflow-x-hidden" style={{ ...profilPopover.positionStyle, maxHeight: '85vh' }}>
        <div className="bg-gradient-to-r from-primary/15 to-transparent p-4 pb-3 flex items-center gap-3">
          <div className="relative flex-shrink-0">
            <img src={getAvatarUrlForDisplay(profilPopover.displayUsername)} className="w-12 h-12 rounded-full border-2 border-base-100 shadow object-cover" alt={profilPopover.displayUsername} />
            {statut && <StatutDot statut={statut} taille="w-3.5 h-3.5 absolute -bottom-0.5 -right-0.5 border-2" />}
          </div>
          <div className="min-w-0">
            <div className="font-bold text-sm truncate">{profilPopover.displayUsername}</div>
            {statut ? <div className={`text-xs font-medium flex items-center gap-1 mt-0.5 ${STATUTS[statut].text}`}>{STATUTS[statut].label}</div> : <div className="text-xs text-gray-400 mt-0.5">Hors ligne</div>}
          </div>
        </div>
        {profilPopover.profil?.bio && <div className="px-4 py-2 text-xs text-gray-500 italic border-t border-base-200 line-clamp-3">{profilPopover.profil.bio}</div>}
        
        <div className="px-3 pb-3 pt-2">
<button 
  onClick={() => demarrerDM(profilPopover.profil.id)} 
  className="btn btn-primary btn-sm w-full mb-2"
>
  <MessageCircle size={14} /> Message privé
</button>
          
          {(() => {
            if (profilPopover.profil?.id === session.user.id) return null;
            
            const relation = [...amis, ...demandesAmis].find(f => f.requester_id === profilPopover.profil?.id || f.receiver_id === profilPopover.profil?.id);
            const estDejaBloque = blockedUsers.includes(profilPopover.profil?.id);

            return (
              <>
                {relation?.status === 'accepted' ? <button className="btn btn-outline btn-sm w-full" disabled>✓ Déjà amis</button> : 
                 relation?.status === 'pending' ? <button className="btn btn-outline btn-sm w-full" disabled>⏳ En attente</button> : 
                 <button onClick={handleAjouterAmi} className="btn btn-success btn-sm w-full"><UserPlus size={14} /> Ajouter en ami</button>}
                
                <button onClick={handleToggleBlock} className={`btn btn-sm w-full mt-2 ${estDejaBloque ? 'btn-outline border-error text-error' : 'btn-error bg-error/20 text-error hover:bg-error hover:text-white'}`}>
                  <ShieldAlert size={14} /> {estDejaBloque ? 'Débloquer' : 'Bloquer cet utilisateur'}
                </button>
              </>
            );
          })()}

      {estModerateur && (
        <div className="mt-3 pt-3 border-t border-base-200">
          <div className="text-[10px] font-black uppercase tracking-widest text-warning mb-2">Modération</div>
          
          {!showMuteOptions ? (
            <button onClick={() => setShowMuteOptions(true)} className="btn btn-warning btn-outline btn-sm w-full mb-1">
              <VolumeX size={14} /> Gérer la restriction
            </button>
          ) : (
            <div className="flex flex-col gap-1.5 animate-[modalIn_0.15s_ease_forwards]">
              <div className="text-[10px] text-base-content/60 font-bold mb-0.5">Durée du mute :</div>
              
              <div className="flex gap-1">
                <button onClick={() => { muter(5); setProfilPopover(null); }} className="btn btn-warning btn-xs flex-1">5m</button>
                <button onClick={() => { muter(60); setProfilPopover(null); }} className="btn btn-warning btn-xs flex-1">1h</button>
                <button onClick={() => { muter(24*60); setProfilPopover(null); }} className="btn btn-warning btn-xs flex-1">24h</button>
              </div>

              <div className="flex gap-1 mt-0.5">
                <input 
                  type="number" min="1" placeholder="Min." 
                  className="input input-bordered input-xs w-full text-center font-bold" 
                  value={customMute} onChange={e => setCustomMute(e.target.value)} 
                />
                <button 
                  onClick={() => { if(customMute > 0) { muter(parseInt(customMute)); setProfilPopover(null); } }} 
                  className="btn btn-warning btn-xs px-3"
                  disabled={!customMute}
                >
                  OK
                </button>
              </div>

              <button onClick={() => { muter(0); setProfilPopover(null); }} className="btn btn-success btn-outline btn-xs w-full mt-1">
                Lever la sanction
              </button>

              <button onClick={() => setShowMuteOptions(false)} className="btn btn-ghost btn-xs w-full text-gray-400 mt-1">
                Annuler
              </button>
            </div>
          )}

          <div className="my-3 opacity-30 h-px bg-base-300"></div>
          
          {!showBanConfirm ? (
            <button 
              onClick={() => setShowBanConfirm(true)} 
              className="btn btn-error btn-outline btn-sm w-full text-white"
            >
              <UserX size={14} /> Bannir du serveur
            </button>
          ) : (
            <div className="flex flex-col gap-2 animate-[modalIn_0.15s_ease_forwards] p-2.5 bg-error/10 border border-error/30 rounded-lg mt-2">
              <div className="text-xs font-bold text-error text-center leading-tight">
                Bannir DÉFINITIVEMENT {profilPopover.displayUsername} ?
              </div>
              <div className="flex gap-2 mt-1">
                <button 
                  onClick={() => { 
                    bannir(profilPopover.profil.id); 
                    setProfilPopover(null); 
                  }} 
                  className="btn btn-error btn-xs flex-1 text-white shadow-sm"
                >
                  Oui, bannir
                </button>
                <button 
                  onClick={() => setShowBanConfirm(false)} 
                  className="btn btn-ghost bg-base-200 hover:bg-base-300 btn-xs flex-1 text-base-content shadow-sm"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}
        </div>
      )}

          
        </div>
      </div>
    </>
  );
}