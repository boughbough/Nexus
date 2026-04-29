import React from 'react';
import { Users, Loader2, X, MessageCircle, Trash } from 'lucide-react';
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

export default function HubAmis({
  ongletAmis,
  setOngletAmis,
  demandesAmis,
  amis,
  rechercheAmi,
  setRechercheAmi,
  ajoutAmiLoading,
  envoyerDemandeAmi,
  repondreDemandeAmi,
  supprimerAmi,
  demarrerDM,
  getAvatarUrlForDisplay,
  getProfilAmi,
  getStatutEffectif,
  onUserClick
}) {
  const { session } = useAuth();

  return (
    <div className="flex-1 flex flex-col bg-base-100 animate-fade-in">
      <div className="h-14 border-b border-base-200 flex items-center px-6 gap-4 shadow-sm bg-base-100/50 backdrop-blur z-10">
        <div className="flex items-center gap-2 font-extrabold text-lg mr-4 border-r border-base-300 pr-6">
          <Users className="text-gray-400" size={22}/> Amis
        </div>
        <button onClick={() => setOngletAmis('tous')} className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${ongletAmis === 'tous' ? 'bg-base-300 text-base-content shadow-sm' : 'text-gray-500 hover:bg-base-200 hover:text-base-content'}`}>Tous</button>
        <button onClick={() => setOngletAmis('attente')} className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${ongletAmis === 'attente' ? 'bg-base-300 text-base-content shadow-sm' : 'text-gray-500 hover:bg-base-200 hover:text-base-content'}`}>
          En attente {demandesAmis.length > 0 && <span className="badge badge-error badge-sm text-[10px] text-white border-0 shadow-sm">{demandesAmis.length}</span>}
        </button>
        <button onClick={() => setOngletAmis('ajouter')} className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${ongletAmis === 'ajouter' ? 'bg-success text-success-content shadow-sm' : 'bg-success/20 text-success hover:bg-success/30'}`}>Ajouter un ami</button>
      </div>

      <div className="flex-1 p-8 overflow-y-auto bg-base-100">
        <div className="max-w-3xl mx-auto">
          {ongletAmis === 'ajouter' && (
             <div className="animate-[toastIn_0.2s_ease_forwards]">
                <h2 className="text-2xl font-extrabold mb-2 uppercase tracking-tight">Ajouter un ami</h2>
                <p className="text-sm text-gray-500 mb-6">Vous pouvez ajouter un ami en tapant exactement son pseudo.</p>
                <form onSubmit={envoyerDemandeAmi} className="flex gap-3 bg-base-200 p-2 rounded-2xl border border-base-300 shadow-inner">
                   <input type="text" className="input bg-transparent border-0 flex-1 focus:outline-none focus:border-transparent focus:ring-0 text-lg px-4" placeholder="Entrez un pseudo..." value={rechercheAmi} onChange={e=>setRechercheAmi(e.target.value)} autoFocus />
                   <button type="submit" disabled={ajoutAmiLoading} className="btn btn-primary rounded-xl px-8 shadow-sm">{ajoutAmiLoading ? <Loader2 className="animate-spin"/> : 'Envoyer la demande'}</button>
                </form>
             </div>
          )}

          {ongletAmis === 'attente' && (
            <div className="animate-[toastIn_0.2s_ease_forwards]">
              <h2 className="text-xs font-bold mb-4 uppercase tracking-widest text-gray-400 border-b border-base-200 pb-2">Demandes en attente — {demandesAmis.length}</h2>
              {demandesAmis.length === 0 ? <div className="text-gray-400 text-center py-20 bg-base-200/30 rounded-2xl border border-dashed border-base-300">Aucune demande en attente.</div> : (
                 <div className="flex flex-col gap-3">
                   {demandesAmis.map(f => {
                     const estEnvoyee = f.requester_id === session.user.id;
                     const ami = getProfilAmi(f);
                     return (
                       <div key={f.id} className="flex items-center justify-between p-4 bg-base-100 border border-base-200 rounded-2xl hover:shadow-md transition-all">
                         <div className="flex items-center gap-4">
                            <img src={getAvatarUrlForDisplay(ami.pseudo)} className="w-12 h-12 rounded-full object-cover" />
                            <div>
                              <div className="font-extrabold text-lg">{ami.pseudo}</div>
                              <div className={`text-xs font-medium ${estEnvoyee ? 'text-gray-400' : 'text-primary'}`}>{estEnvoyee ? 'Demande envoyée...' : 'Demande reçue !'}</div>
                            </div>
                         </div>
                         <div className="flex gap-2">
                           {!estEnvoyee && <button onClick={() => repondreDemandeAmi(f.id, true)} className="btn btn-success btn-circle text-white shadow-sm">✓</button>}
                           <button onClick={() => repondreDemandeAmi(f.id, false)} className="btn btn-error btn-circle text-white shadow-sm"><X size={20}/></button>
                         </div>
                       </div>
                     );
                   })}
                 </div>
              )}
            </div>
          )}

          {ongletAmis === 'tous' && (
             <div className="animate-[toastIn_0.2s_ease_forwards]">
              <h2 className="text-xs font-bold mb-4 uppercase tracking-widest text-gray-400 border-b border-base-200 pb-2">Tous les amis — {amis.length}</h2>
              {amis.length === 0 ? (
                <div className="text-gray-400 text-center py-20 flex flex-col items-center bg-base-200/30 rounded-2xl border border-dashed border-base-300">
                  <Users size={64} className="opacity-20 mb-4"/> Pas encore d'amis.
                </div>
              ) : (
                 <div className="flex flex-col gap-2">
                   {amis.map(f => {
                     const ami = getProfilAmi(f);
                     const statut = getStatutEffectif(ami.pseudo, ami);
                     return (
                       <div 
  key={f.id} 
  onClick={(e) => onUserClick(e, ami.pseudo)} 
  className="flex items-center justify-between p-3 rounded-2xl hover:bg-base-200 cursor-pointer group transition-all border border-transparent hover:border-base-300"
>
                         <div className="flex items-center gap-4">
                            <div className="relative">
                              <img src={getAvatarUrlForDisplay(ami.pseudo)} className="w-10 h-10 rounded-full object-cover shadow-sm" />
                              {statut && <StatutDot statut={statut} taille="w-3.5 h-3.5 absolute -bottom-0.5 -right-0.5 border-2" />}
                            </div>
                            <div>
                              <div className="font-bold text-base group-hover:text-primary transition-colors">{ami.pseudo}</div>
                              <div className={`text-[11px] font-medium ${statut ? STATUTS[statut]?.text : 'text-gray-400'}`}>{statut ? STATUTS[statut]?.label : 'Hors ligne'}</div>
                            </div>
                         </div>
                         <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button onClick={(e) => { e.stopPropagation(); demarrerDM(ami.pseudo); }} className="btn btn-base-300 btn-sm btn-circle"><MessageCircle size={16}/></button>
                           <button onClick={(e) => { e.stopPropagation(); supprimerAmi(f.id); }} className="btn btn-ghost btn-sm btn-circle text-gray-400 hover:text-error"><Trash size={16}/></button>
                         </div>
                       </div>
                     );
                   })}
                 </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}