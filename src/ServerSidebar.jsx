import { useState, useEffect, useRef } from 'react';
import { Globe , SquarePlus , Mailbox, House, Plus, Compass, X, Upload, Loader2, Settings, LogOut, FolderPlus,Copy, ChevronDown, ChevronRight, Trash, UserPlus, Image as ImageIcon } from 'lucide-react';
import { supabase } from './supabase';

import ModaleCreerServeur from './ModaleCreerServeur';
import ModaleRejoindreServeur from './ModaleRejoindreServeur';
import ModaleCreerGroupe from './ModaleCreerGroupe';
import { useAuth } from './contexts/AuthContext';
import { useUI } from './contexts/UIContext';


export default function ServerSidebar({ servers, setServers, serverActuel, onSelectServer, onSelectHome, isHome, notifsDMs, onSelectExplorer, vueActive, notifications, onLeaveServer, groups, setGroups, memberMeta, setMemberMeta, demandesEnAttente = 0 ,ping}) {
  const { session, monProfil, pseudo } = useAuth();
  const { ajouterToast, menuMobileOuvert, fermerMenuMobile } = useUI();
  const [modalOuverte, setModalOuverte] = useState(null);
  const [isClosingModal, setIsClosingModal] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [collapsed, setCollapsed] = useState(() => JSON.parse(localStorage.getItem('chat_groups_collapsed')) || {});
  
  useEffect(() => { localStorage.setItem('chat_groups_collapsed', JSON.stringify(collapsed)); }, [collapsed]);

  const [menuContextuel, setMenuContextuel] = useState(null);
  const [menuFermeture, setMenuFermeture] = useState(false);
  const menuFermetureRef = useRef(null);

  const [menuGroupe, setMenuGroupe] = useState(null);
  const [menuGroupeFermeture, setMenuGroupeFermeture] = useState(false);
  const menuGroupeFermetureRef = useRef(null);
  
  const [modalConfirm, setModalConfirm] = useState(null);
  const [groupeEnEdition, setGroupeEnEdition] = useState(null);
  const [nomGroupeEdition, setNomGroupeEdition] = useState('');
  
  const [dragId, setDragId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);
  const [dropPosition, setDropPosition] = useState(null);

  


  const handleDragStart = (e, server) => {
    e.dataTransfer.setData('text/plain', server.id);
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => setDragId(server.id), 0);
  };
  const handleDragOver = (e, targetServer) => {
    e.preventDefault(); e.dataTransfer.dropEffect = 'move';
    if (dragId === targetServer.id) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = e.clientY < (rect.top + rect.height / 2) ? 'before' : 'after';
    if (dragOverId !== targetServer.id || dropPosition !== pos) { setDragOverId(targetServer.id); setDropPosition(pos); }
  };
  const handleDragLeave = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) { setDragOverId(null); setDropPosition(null); }
  };
  const handleDrop = async (e, targetServer) => {
    e.preventDefault();
    const currentDragId = dragId;
    setDragId(null); setDragOverId(null); setDropPosition(null);
    if (!currentDragId || currentDragId === targetServer.id) return;

    const draggedGroupId = memberMeta[currentDragId]?.group_id || null;
    const targetGroupId = memberMeta[targetServer.id]?.group_id || null;
    let targetArray = targetGroupId ? getGroupServers(targetGroupId) : ungrouped;
    let rest = targetArray.filter(s => s.id !== currentDragId);
    const draggedSrv = servers.find(s => s.id === currentDragId);

    let insertIdx = rest.findIndex(s => s.id === targetServer.id);
    if (dropPosition === 'after') insertIdx += 1;
    rest.splice(insertIdx, 0, draggedSrv);

    setMemberMeta(prev => {
      const next = { ...prev };
      if (draggedGroupId !== targetGroupId) next[currentDragId] = { ...next[currentDragId], group_id: targetGroupId };
      rest.forEach((s, i) => { next[s.id] = { ...next[s.id], position: i }; });
      return next;
    });

    if (draggedGroupId !== targetGroupId) await supabase.from('server_members').update({ group_id: targetGroupId }).eq('server_id', currentDragId).eq('user_id', session.user.id);
    await Promise.all(rest.map((s, i) => supabase.from('server_members').update({ position: i }).eq('server_id', s.id).eq('user_id', session.user.id)));
  };
  const handleDropOnGroup = async (e, targetGroupId) => {
    e.preventDefault(); e.stopPropagation();
    const currentDragId = dragId;
    setDragId(null); setDragOverId(null); setDropPosition(null);
    if (!currentDragId) return;

    const draggedGroupId = memberMeta[currentDragId]?.group_id || null;
    if (draggedGroupId === targetGroupId) return;

    const targetServers = targetGroupId ? getGroupServers(targetGroupId) : ungrouped;
    const newPos = targetServers.length > 0 ? Math.max(...targetServers.map(s => memberMeta[s.id]?.position || 0)) + 1 : 0;

    setMemberMeta(prev => ({ ...prev, [currentDragId]: { ...prev[currentDragId], group_id: targetGroupId, position: newPos } }));
    await supabase.from('server_members').update({ group_id: targetGroupId, position: newPos }).eq('server_id', currentDragId).eq('user_id', session.user.id);
  };

  const fermerModalAnime= () => {
    setIsClosingModal(true);
    setTimeout(() => {
      setModalOuverte(null);
      setModalConfirm(null);
      setIsClosingModal(false);
      setInviteCode('');
    }, 200);
  };


  const fermerMenuContextuel = () => {
    setMenuFermeture(true);
    if (menuFermetureRef.current) clearTimeout(menuFermetureRef.current);
    menuFermetureRef.current = setTimeout(() => {
      setMenuContextuel(null);
      setMenuFermeture(false);
    }, 150);
  };

  const fermerMenuGroupe = () => {
    setMenuGroupeFermeture(true);
    if (menuGroupeFermetureRef.current) clearTimeout(menuGroupeFermetureRef.current);
    menuGroupeFermetureRef.current = setTimeout(() => {
      setMenuGroupe(null);
      setMenuGroupeFermeture(false);
    }, 150);
  };

  const ouvrirMenu = (e, server) => {
    e.preventDefault(); e.stopPropagation();
    if (menuFermetureRef.current) clearTimeout(menuFermetureRef.current);
    setMenuFermeture(false);
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuContextuel({ server, x: rect.right + 8, y: Math.min(rect.top, window.innerHeight - 320) });
  };

  const handleDeplacer = (serverId, groupId) => {
    fermerMenuContextuel();
    setTimeout(async () => {
      const gid = groupId === '__none__' ? null : groupId;
      setMemberMeta(prev => ({ ...prev, [serverId]: { ...prev[serverId], group_id: gid } }));
      await supabase.from('server_members').update({ group_id: gid }).eq('server_id', serverId).eq('user_id', session.user.id);
    }, 150);
  };

  const handleQuitter = (server) => {
    fermerMenuContextuel();
    setTimeout(async () => {
      if (server.owner_id === session.user.id) { 
        ajouterToast("Vous êtes le propriétaire. Pour quitter, supprimez le serveur dans ses paramètres.", 'error'); 
        return; 
      }
      const { data, error } = await supabase.from('server_members').delete().eq('server_id', server.id).eq('user_id', session.user.id).select();
      if (error || !data || data.length === 0) { 
        ajouterToast("Impossible de quitter.", 'error'); 
        return; 
      }
      ajouterToast(`Vous avez quitté ${server.name}`);
      onLeaveServer?.(server.id); 
    }, 150);
  };

  const handleParametres = (server) => {
    fermerMenuContextuel();
    setTimeout(() => {
      onSelectServer(server, null); 
      setTimeout(() => window.dispatchEvent(new CustomEvent('open-server-settings')), 100);
    }, 150);
  };

  useEffect(() => {
    if (!menuContextuel && !menuGroupe) return;
    const handler = (e) => { 
      if (!e.target.closest('[data-ctx-menu]')) { 
        if (menuContextuel) fermerMenuContextuel(); 
        if (menuGroupe) fermerMenuGroupe(); 
      }
    };
    setTimeout(() => window.addEventListener('mousedown', handler), 10);
    return () => window.removeEventListener('mousedown', handler);
  }, [menuContextuel, menuGroupe]);

  const sauvegarderNomGroupe = async (groupId) => {
    if (!nomGroupeEdition.trim()) { setGroupeEnEdition(null); return; }
    const nouveauNom = nomGroupeEdition.trim();
    setGroups(prev => prev.map(g => g.id === groupId ? { ...g, name: nouveauNom } : g));
    setGroupeEnEdition(null);
    await supabase.from('server_groups').update({ name: nouveauNom }).eq('id', groupId).eq('user_id', session.user.id);
  };

  const supprimerGroupe = async (groupId) => {
    await supabase.from('server_members').update({ group_id: null }).eq('group_id', groupId).eq('user_id', session.user.id);
    await supabase.from('server_groups').delete().eq('id', groupId);
    setGroups(prev => prev.filter(g => g.id !== groupId));
    setMemberMeta(prev => { const n = { ...prev }; Object.keys(n).forEach(sid => { if (n[sid]?.group_id === groupId) n[sid] = { ...n[sid], group_id: null }; }); return n; });
  };

  const getSorted = () => [...servers].sort((a, b) => (memberMeta[a.id]?.position ?? 999) - (memberMeta[b.id]?.position ?? 999));
  const ungrouped = getSorted().filter(s => !memberMeta[s.id]?.group_id);
  const getGroupServers = (gid) => getSorted().filter(s => memberMeta[s.id]?.group_id === gid);
  const getInitiales = (name) => name?.slice(0, 2).toUpperCase() || '?';
  const hasUnread = (server) => notifications && Object.entries(notifications).some(([room, count]) => room.startsWith(`server-${server.id}-`) && count > 0);

  const renderServerIcon = (server) => {
    const isActive = serverActuel?.id === server.id;
    const isDragging = dragId === server.id;
    const isDragOver = dragOverId === server.id;

    return (
      <div key={server.id} className="flex flex-col items-center w-full relative" onDragOver={(e) => handleDragOver(e, server)} onDragLeave={handleDragLeave} onDrop={(e) => handleDrop(e, server)}>
        {isDragOver && dropPosition === 'before' && <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-10 h-1.5 bg-primary rounded-full z-50 pointer-events-none" />}
        <div draggable onDragStart={(e) => handleDragStart(e, server)} onDragEnd={() => setDragId(null)} onContextMenu={e => ouvrirMenu(e, server)} onClick={() => { if (!isDragging) onSelectServer(server, null); }}
          className={`relative flex-shrink-0 transition-all ${isDragging ? 'opacity-30 scale-90' : 'hover:scale-[1.05] active:scale-95'} cursor-pointer mb-1 mt-1`}
        >
          {hasUnread(server) && !isActive && <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-2 h-2 bg-base-content rounded-full shadow-sm pointer-events-none" />}
          <div title={server.name} className={`w-12 h-12 rounded-2xl flex items-center justify-center overflow-hidden transition-all select-none shadow-sm ${isActive ? 'rounded-xl ring-2 ring-primary' : 'bg-base-200 hover:bg-primary/20 hover:rounded-xl'}`}>
            {server.icon_url ? <img src={server.icon_url} className="w-full h-full object-cover pointer-events-none" draggable={false} /> : <span className="font-bold text-sm pointer-events-none">{getInitiales(server.name)}</span>}
          </div>
        </div>
        {isDragOver && dropPosition === 'after' && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-10 h-1.5 bg-primary rounded-full z-50 pointer-events-none" />}
      </div>
    );
  };

  return (
    <>
    <div className={`w-[72px] bg-base-300 flex flex-col items-center pt-4 pb-2 gap-3 shrink-0 border-r border-base-100 absolute md:relative z-[120] h-full transition-transform duration-300 ${menuMobileOuvert ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>         
        
        <div className="relative group mb-2 flex-shrink-0">
          <button 
            onClick={onSelectHome} 
            className={`cursor-pointer flex items-center justify-center w-12 h-12 rounded-[24px] hover:rounded-[16px] transition-all duration-300 ${isHome ? 'bg-primary text-white rounded-[16px]' : 'bg-base-200 text-base-content hover:bg-primary/50'}`}
          >
            <House size={28}/>
          </button>
          
          {(notifsDMs > 0 || demandesEnAttente > 0) && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-error border-2 border-base-200 rounded-full flex items-center justify-center z-10 animate-pulse">
            </span>
          )}
          
          <div className="absolute left-0 w-1 bg-base-content rounded-r-full transition-all duration-200 scale-y-0 group-hover:scale-y-50 origin-left" style={{ height: '20px', transform: isHome ? 'scale-y(1.5)' : '' }} />
        </div>
        <div className="w-8 h-px bg-base-content/10 flex-shrink-0 mb-1" />

        <div className="flex-1 w-full overflow-y-auto flex flex-col items-center gap-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          
          {dragId && <div onDragOver={(e) => { e.preventDefault(); setDragOverId('ungrouped-zone'); }} onDragLeave={() => setDragOverId(null)} onDrop={(e) => handleDropOnGroup(e, null)} className={`w-10 h-2 rounded-full mb-1 flex-shrink-0 transition-all ${dragOverId === 'ungrouped-zone' ? 'bg-primary scale-150' : 'bg-base-content/20 border border-dashed border-base-content/40'}`} title="Glisser ici pour retirer du groupe" />}

          {ungrouped.map(server => renderServerIcon(server))}

          {groups.map(group => {
            const gServers = getGroupServers(group.id);
            const isCollapsed = collapsed[group.id];
            return (
              <div key={group.id} className="flex flex-col items-center w-full flex-shrink-0 mt-2">
                
                <div 
                  onDragOver={(e) => { e.preventDefault(); if (dragId) setDragOverId(`group-header-${group.id}`); }} 
                  onDragLeave={() => setDragOverId(null)} 
                  onDrop={(e) => handleDropOnGroup(e, group.id)} 
                  onClick={() => setCollapsed(prev => ({ ...prev, [group.id]: !prev[group.id] }))}
                  onContextMenu={(e) => { 
                    e.preventDefault(); e.stopPropagation(); 
                    if (menuGroupeFermetureRef.current) clearTimeout(menuGroupeFermetureRef.current);
                    setMenuGroupeFermeture(false);
                    const rect = e.currentTarget.getBoundingClientRect(); 
                    setMenuGroupe({ group, x: rect.right + 8, y: Math.min(rect.top, window.innerHeight - 100) }); 
                  }}
                  className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center overflow-hidden transition-all cursor-pointer select-none mb-1 shadow-sm ${isCollapsed ? 'bg-base-200 hover:bg-primary/20 hover:rounded-xl' : 'bg-base-200/50 hover:bg-base-200'} ${dragOverId === `group-header-${group.id}` ? 'ring-2 ring-primary scale-105' : ''}`}
                  title={group.name}
                >
                  {groupeEnEdition === group.id ? (
                    <input 
                      type="text" autoFocus 
                      className="w-10 text-[9px] text-center bg-base-100 text-base-content border border-primary/50 rounded outline-none py-0.5" 
                      value={nomGroupeEdition} 
                      onChange={(e) => setNomGroupeEdition(e.target.value)} 
                      onBlur={() => sauvegarderNomGroupe(group.id)} 
                      onKeyDown={(e) => e.key === 'Enter' && sauvegarderNomGroupe(group.id)} 
                      onClick={e => e.stopPropagation()} 
                    />
                  ) : (
                    <>
                      <div className="flex items-center justify-center text-gray-500 mb-0.5">
                        {isCollapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                      </div>
                      <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest truncate w-10 text-center leading-tight">
                        {group.name}
                      </span>
                    </>
                  )}
                </div>

                {!isCollapsed && (
                  <div className="flex flex-col items-center w-full">
                    {gServers.map(server => renderServerIcon(server))}
                    
                    {gServers.length === 0 && (
                      <div 
                        onDragOver={(e) => { e.preventDefault(); if (dragId) setDragOverId(`empty-${group.id}`); }} 
                        onDragLeave={() => setDragOverId(null)} 
                        onDrop={async (e) => { 
                          e.preventDefault(); 
                          if (!dragId) return; 
                          const currentDragId = dragId; 
                          setDragId(null); setDragOverId(null); 
                          setMemberMeta(prev => ({ ...prev, [currentDragId]: { ...prev[currentDragId], group_id: group.id, position: 0 } })); 
                          await supabase.from('server_members').update({ group_id: group.id, position: 0 }).eq('server_id', currentDragId).eq('user_id', session.user.id); 
                        }} 
                        className={`w-12 h-12 flex-shrink-0 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-colors ${dragOverId === `empty-${group.id}` ? 'border-primary bg-primary/10' : 'border-base-content/20'}`}
                      >
                        <span className="text-[8px] text-gray-500 font-bold uppercase">Vide</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          <div className="w-8 h-px bg-base-content/10 flex-shrink-0 my-2" />

          <div className="flex flex-col gap-2 items-center relative z-10 pb-4 flex-shrink-0">
            <button onClick={() => setModalOuverte('create')} title="Créer un serveur" 
              className="btn btn-square h-12 w-12 bg-base-100 border-base-300 text-success hover:bg-success hover:text-success-content hover:border-success rounded-2xl hover:rounded-xl shadow-sm transition-all duration-200">
              <Plus size={22} />
            </button>
            <button onClick={() => setModalOuverte('join')} title="Rejoindre un serveur" 
              className="btn btn-square h-12 w-12 bg-base-100 border-base-300 text-primary hover:bg-primary hover:text-primary-content hover:border-primary rounded-2xl hover:rounded-xl shadow-sm transition-all duration-200">
              <SquarePlus size={20} />
            </button>
            <button onClick={() => setModalOuverte('folder')} title="Créer un groupe" 
              className="btn btn-square h-12 w-12 bg-base-100 border-base-300 text-warning hover:bg-warning hover:text-warning-content hover:border-warning rounded-2xl hover:rounded-xl shadow-sm transition-all duration-200">
              <FolderPlus size={20} />
            </button>
            <button onClick={onSelectExplorer} title="Explorer" 
              className={`btn btn-square h-12 w-12 rounded-2xl hover:rounded-xl shadow-sm transition-all duration-200 ${
                vueActive === 'explorer' ? 'bg-info text-info-content border-info' : 'bg-base-100 border-base-300 text-info hover:bg-info hover:text-info-content hover:border-info'
              }`}>
              <Globe  size={20} />
            </button>
          </div>
        </div>

        <div className="mt-auto mb-1 flex flex-col items-center gap-1 cursor-default flex-shrink-0" title={`Latence: ${ping} ms`}>
           <div className={`w-2 h-2 rounded-full ${ping === null ? 'bg-base-content/20 animate-pulse' : ping < 100 ? 'bg-success shadow-[0_0_8px_rgba(0,169,110,0.5)]' : ping < 300 ? 'bg-warning' : 'bg-error animate-pulse'}`}></div>
           {ping !== null && (
             <span className="text-[10px] font-mono font-bold text-base-content/50">
               {ping} ms
             </span>
           )}
        </div>

      </div>

      <ModaleCreerServeur
        isOpen={modalOuverte === 'create'}
        isClosingModal={isClosingModal}
        fermerModal={fermerModalAnime}
        session={session}
        pseudo={pseudo}
        monProfil={monProfil}
        servers={servers}
        setServers={setServers}
        onSelectServer={onSelectServer}
        ajouterToast={ajouterToast}
      />

      <ModaleRejoindreServeur
        isOpen={modalOuverte === 'join'}
        isClosingModal={isClosingModal}
        fermerModal={fermerModalAnime}
        session={session}
        pseudo={pseudo}
        servers={servers}
        setServers={setServers}
        onSelectServer={onSelectServer}
        ajouterToast={ajouterToast}
      />

      <ModaleCreerGroupe
        isOpen={modalOuverte === 'folder'}
        isClosingModal={isClosingModal}
        fermerModal={fermerModalAnime}
        session={session}
        servers={servers}
        groups={groups}
        setGroups={setGroups}
        ajouterToast={ajouterToast}
      />

      {menuContextuel && (
        <div data-ctx-menu 
             className={`fixed z-[600] bg-base-100 rounded-xl shadow-2xl border border-base-200 py-2 w-60 text-sm overflow-hidden ${menuFermeture ? 'menu-contextuel-exit' : 'menu-contextuel-enter'}`} 
             style={{ top: menuContextuel.y, left: menuContextuel.x }}>
          <div className="px-3 pb-2 mb-1 border-b border-base-200 font-bold text-xs text-gray-400 truncate uppercase tracking-wider">{menuContextuel.server.name}</div>
          <ul className="p-0 flex flex-col">
            <li><button onClick={() => handleParametres(menuContextuel.server)} className="flex items-center gap-2 px-3 py-2 hover:bg-base-200 w-full text-left rounded-lg"><Settings size={14}/> Paramètres</button></li>
            {groups.length > 0 && (
              <>
                <div className="px-3 pt-2 pb-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Déplacer dans</div>
                <li><button onClick={() => handleDeplacer(menuContextuel.server.id, '__none__')} className={`flex items-center gap-2 px-3 py-1.5 hover:bg-base-200 w-full text-left rounded-lg ${!memberMeta[menuContextuel.server.id]?.group_id ? 'text-primary font-semibold' : ''}`}><span className="w-2 h-2 rounded-full bg-base-300 flex-shrink-0" /> Sans groupe</button></li>
                {groups.map(g => (
                  <li key={g.id}><button onClick={() => handleDeplacer(menuContextuel.server.id, g.id)} className={`flex items-center gap-2 px-3 py-1.5 hover:bg-base-200 w-full text-left rounded-lg ${memberMeta[menuContextuel.server.id]?.group_id === g.id ? 'text-primary font-semibold' : ''}`}><span className="w-2 h-2 rounded-full bg-warning flex-shrink-0" /> {g.name}</button></li>
                ))}
              </>
            )}

            <li>
              <button 
                onClick={() => { 
                  setInviteCode(menuContextuel.server.invite_code); 
                  setModalOuverte('invite'); 
                  fermerMenuContextuel(); 
                }} 
                className="flex items-center gap-2 px-3 py-2 hover:bg-primary/10 text-primary w-full text-left rounded-lg transition-colors font-medium"
              >
                <UserPlus size={15}/> Inviter des amis
              </button>
            </li>
            <div className="border-t border-base-200 my-1" />
            <div className="border-t border-base-200 my-1" />
            <li><button onClick={() => handleQuitter(menuContextuel.server)} className="flex items-center gap-2 px-3 py-2 hover:bg-error/10 text-error w-full text-left rounded-lg transition-colors"><LogOut size={14}/> Quitter</button></li>
          </ul>
        </div>
      )}

      {menuGroupe && (
        <div data-ctx-menu 
             className={`fixed z-[600] bg-base-100 rounded-xl shadow-2xl border border-base-200 py-2 w-48 text-sm overflow-hidden ${menuGroupeFermeture ? 'menu-contextuel-exit' : 'menu-contextuel-enter'}`} 
             style={{ top: menuGroupe.y, left: menuGroupe.x }}>
          <div className="px-3 pb-2 mb-1 border-b border-base-200 font-bold text-xs text-gray-400 truncate uppercase tracking-wider">{menuGroupe.group.name}</div>
          <ul className="p-0 flex flex-col">
            <li><button onClick={() => { fermerMenuGroupe(); setTimeout(() => { setGroupeEnEdition(menuGroupe.group.id); setNomGroupeEdition(menuGroupe.group.name); }, 150); }} className="flex items-center gap-2 px-3 py-2 hover:bg-base-200 w-full text-left rounded-lg"><Settings size={14}/> Renommer</button></li>
            <div className="border-t border-base-200 my-1" />
            <li><button onClick={() => { fermerMenuGroupe(); setTimeout(() => { setModalConfirm({ message: `Supprimer le groupe "${menuGroupe.group.name}" ?`, onConfirm: () => supprimerGroupe(menuGroupe.group.id), danger: true }); }, 150); }} className="flex items-center gap-2 px-3 py-2 hover:bg-error/10 text-error w-full text-left rounded-lg"><Trash size={14}/> Supprimer le dossier</button></li>
          </ul>
        </div>
      )}

      {modalConfirm && (
        <div className="fixed inset-0 z-[700] flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setModalConfirm(null)} />
          <div className="relative bg-base-100 rounded-2xl shadow-2xl border border-base-200 w-full max-w-xs mx-4 p-5 z-10 animate-[modalIn_0.18s_cubic-bezier(0.34,1.2,0.64,1)_forwards]">
            <p className="text-sm text-base-content/80 mb-4 leading-relaxed">{modalConfirm.message}</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setModalConfirm(null)} className="btn btn-ghost btn-sm">Annuler</button>
              <button onClick={() => { modalConfirm.onConfirm(); setModalConfirm(null); }} className={`btn btn-sm ${modalConfirm.danger ? 'btn-error' : 'btn-primary'}`}>Confirmer</button>
            </div>
          </div>
        </div>
      )}


      {modalOuverte === 'invite' && (
        <div className="fixed inset-0 z-[700] flex items-center justify-center">
          <div 
            className={`fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-200 ${isClosingModal ? 'opacity-0' : 'opacity-100'}`} 
            onClick={fermerModalAnime} 
          />
          
          <div className={`relative bg-base-100 rounded-3xl shadow-2xl border border-base-200 w-full max-w-sm mx-4 p-8 z-10 transition-all duration-200 ease-out transform ${isClosingModal ? 'opacity-0 scale-95 translate-y-4' : 'animate-[modalIn_0.2s_ease_forwards] opacity-100 scale-100 translate-y-0'}`}>
            
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-black text-2xl flex items-center gap-3 text-base-content">
                <UserPlus className="text-primary" size={28} /> 
                Inviter
              </h3>
              <button onClick={fermerModalAnime} className="btn btn-ghost btn-sm btn-circle text-gray-400">
                <X size={20}/>
              </button>
            </div>
            
            <p className="text-sm text-base-content/60 mb-8 leading-relaxed">
              Partagez ce code unique avec vos amis pour qu'ils rejoignent votre serveur.
            </p>
            
            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 opacity-70">Code du serveur</label>
              <div className="flex flex-col gap-3">
                <input 
                  type="text" 
                  readOnly 
                  value={inviteCode} 
                  className="input input-bordered w-full bg-base-200/50 font-mono text-2xl text-center h-16 font-black tracking-[0.3em] focus:outline-none border-2 border-dashed border-base-300 text-primary uppercase" 
                />
                <button 
                  onClick={() => { 
                    navigator.clipboard.writeText(inviteCode); 
                    ajouterToast('Code copié !', 'success');
                  }} 
                  className="btn btn-primary h-14 w-full rounded-2xl text-lg font-bold transition-colors border-none active:scale-95"
                >
                  <Copy size={20} className="mr-2" />
                  Copier le code
                </button>
              </div>
            </div>
            
            <div className="mt-6 text-[10px] text-center text-gray-400 uppercase tracking-widest opacity-40">
              Code permanent
            </div>
          </div>
        </div>
      )}
    </>
  );
}