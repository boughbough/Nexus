import React from 'react';
import { Crown, ShieldCheck, Shield, User } from 'lucide-react';

const ROLE_ICONS = { owner: Crown, admin: ShieldCheck, moderator: Shield, member: User };
const ROLE_COLORS = { owner: 'text-yellow-400', admin: 'text-blue-400', moderator: 'text-purple-400', member: 'text-gray-400' };
const ROLE_LABELS = { owner: 'Propriétaire', admin: 'Admins', moderator: 'Modérateurs', member: 'Membres' };

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

export default function PanneauMembres({ membres, getAvatarUrl, onUserClick, profilsCache, getStatutEffectif}) {
  return (
    <div className="w-56 bg-base-200 border-l border-base-300 overflow-y-auto p-4 flex-shrink-0 animate-fade-in z-10">
      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 opacity-60">
        Membres — {membres.length}
      </div>
      
      {['owner', 'admin', 'moderator', 'member'].map(role => {
        const group = membres.filter(m => m.role === role);
        if (!group.length) return null;
        const Icon = ROLE_ICONS[role];

        return (
          <div key={role} className="mb-6">
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              {ROLE_LABELS[role]} — {group.length}
            </div>
            <div className="flex flex-col gap-1">
              {group.map(m => {
                let auteurTech = m.pseudo;
                if (profilsCache) {
                    Object.keys(profilsCache).forEach(k => { if(profilsCache[k]?.pseudo === m.pseudo) auteurTech = k; });
                }
                const statut = profilsCache && getStatutEffectif ? getStatutEffectif(auteurTech, profilsCache[auteurTech]) : null;

                return (
                  <div key={m.id || m.pseudo} 
                    className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-base-300/80 transition-all cursor-pointer group/member" 
                    onClick={(e) => onUserClick(e, m.pseudo)}
                  >
                    <div className="relative">
                      <img src={getAvatarUrl(m.pseudo)} className="w-8 h-8 rounded-full object-cover flex-shrink-0 shadow-sm" />
                      {statut && <StatutDot statut={statut} taille="w-2.5 h-2.5 absolute -bottom-0.5 -right-0.5 border-2" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm truncate font-medium group-hover/member:text-primary transition-colors ${ROLE_COLORS[m.role]}`}>
                        {m.pseudo}
                      </div>
                    </div>
                    <Icon size={12} className={`${ROLE_COLORS[m.role]} opacity-50 group-hover/member:opacity-100`} />
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}