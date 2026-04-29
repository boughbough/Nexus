import React from 'react';
import { Crown, ShieldCheck, Shield, User, UserMinus } from 'lucide-react';

const ROLE_ICONS = { owner: Crown, admin: ShieldCheck, moderator: Shield, member: User };
const ROLE_COLORS = { owner: 'text-yellow-400', admin: 'text-blue-400', moderator: 'text-purple-400', member: 'text-gray-400' };

export default function TabMembres({ membres, monRole, session, onRoleChange, onKick }) {
  const isOwner = monRole === 'owner';

  return (
    <div className="flex flex-col gap-2">
      {membres.map(m => {
        const Icon = ROLE_ICONS[m.role] || User;
        const estMoi = m.user_id === session.user.id;
        const peutGerer = isOwner || (monRole === 'admin' && (m.role === 'moderator' || m.role === 'member'));

        return (
          <div key={m.id} className="flex items-center gap-3 bg-base-200 rounded-lg px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-base-300 flex items-center justify-center font-bold text-sm">
              {m.pseudo?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{m.pseudo} {estMoi && "(vous)"}</div>
              <div className={`text-xs flex items-center gap-1 ${ROLE_COLORS[m.role]}`}>
                <Icon size={11}/> {m.role}
              </div>
            </div>
            {peutGerer && !estMoi && (
              <div className="flex gap-1">
                <select className="select select-bordered select-xs" value={m.role} 
                        onChange={e => onRoleChange(m.user_id, e.target.value)}>
                  <option value="member">Membre</option>
                  <option value="moderator">Modérateur</option>
                  {isOwner && <option value="admin">Admin</option>}
                </select>
                <button onClick={() => onKick(m.user_id, m.pseudo)} className="btn btn-ghost btn-xs btn-circle text-error"><UserMinus size={13}/></button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}