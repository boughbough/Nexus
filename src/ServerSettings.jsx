import { useState, useEffect } from 'react';
import {ShieldAlert, Info, Eraser, Plus, X, Copy, RefreshCw, Settings, LogOut, Users, Trash2 } from 'lucide-react';
import { supabase } from './supabase';

import TabGeneral from './TabGeneral';
import TabMembres from './TabMembres';
import ModaleSuppressionServeur from './ModaleSuppressionServeur';

export default function ServerSettings({ server, monRole, session, monProfil, onClose, onServerDeleted, onServerUpdated, ajouterToast, initialTab , demanderConfirmation}) {
  const [onglet, setOnglet] = useState(initialTab || 'general');
  const [membres, setMembres] = useState([]);
  const [channels, setChannels] = useState([]);
  const [newChannel, setNewChannel] = useState('');
  const [showDelModal, setShowDelModal] = useState(false);
  const [delLoading, setDelLoading] = useState(false);
  const [newChannelRoles, setNewChannelRoles] = useState('all');

  const estLeProprietaire = monRole === 'owner' || server.owner_id === session.user.id;
  const isAdmin = ['owner', 'admin'].includes(monRole) || estLeProprietaire;

  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const chargerLogs = async () => {
    setLoadingLogs(true);
    const { data } = await supabase
      .from('server_logs')
      .select(`
        *,
        actor:actor_id (pseudo, avatar_url)
      `)
      .eq('server_id', server.id)
      .order('created_at', { ascending: false })
      .limit(50);
    
    setLogs(data || []);
    setLoadingLogs(false);
  };

  useEffect(() => {
    if (onglet === 'logs') chargerLogs();
  }, [onglet]);

  useEffect(() => { chargerMembres(); chargerChannels(); }, []);

  const chargerMembres = async () => {
    const { data } = await supabase.from('server_members').select('*').eq('server_id', server.id).order('joined_at');
    setMembres(data || []);
  };

  const chargerChannels = async () => {
    const { data } = await supabase.from('server_channels').select('*').eq('server_id', server.id).order('position');
    setChannels(data || []);
  };

  const executerSuppression = async () => {
    setDelLoading(true);
    try {
      const { error } = await supabase
        .from('servers')
        .delete()
        .eq('id', server.id);

      if (error) throw error;

      ajouterToast("Serveur supprimé définitivement.");
      onServerDeleted(server.id);
    } catch (err) {
      console.error("Erreur suppression:", err);
      ajouterToast("Impossible de supprimer le serveur.", "error");
      setDelLoading(false);
    }
  };

  const executerQuitter = async () => {
    const { error } = await supabase
      .from('server_members')
      .delete()
      .eq('server_id', server.id)
      .eq('user_id', session.user.id);

    if (error) {
      ajouterToast("Erreur lors du départ", "error");
    } else {
      ajouterToast("Vous avez quitté le serveur", "success");
      onServerDeleted(server.id); 
    }
  };

  const changerRole = async (userId, role) => {
    const { data } = await supabase.from('server_members').update({ role }).eq('server_id', server.id).eq('user_id', userId).select();
    if (data?.length) { chargerMembres(); ajouterToast('Rôle mis à jour'); }
    else { ajouterToast('Permission refusée', 'error'); }
  };

  const ajouterChannel = async () => {
    if (!newChannel.trim()) return;
    
    let allowedRoles = null;
    if (newChannelRoles === 'admin') allowedRoles = ['owner', 'admin'];
    if (newChannelRoles === 'mod') allowedRoles = ['owner', 'admin', 'moderator'];

    const { error } = await supabase.from('server_channels').insert({
      server_id: server.id,
      name: newChannel.trim().toLowerCase().replace(/\s+/g, '-'),
      position: channels.length,
      allowed_roles: allowedRoles
    });

    if (error) {
      ajouterToast("Erreur lors de la création", "error");
    } else {
      ajouterToast("Salon créé !", "success");
      setNewChannel('');
      chargerChannels(); 

      await supabase.from('server_logs').insert({
        server_id: server.id,
        actor_id: session.user.id,
        action_type: 'create_channel',
        details: `A créé le salon #${newChannel.trim().toLowerCase()}`
      });
    }
  };

  const supprimerChannel = async (channelId, channelName) => {
    if (typeof demanderConfirmation !== 'function') {
      alert("Erreur de configuration : demanderConfirmation manque.");
      return;
    }

    demanderConfirmation(
      <span>Voulez-vous supprimer le salon <span className="font-black text-primary">#{channelName}</span> ?</span>,
      async () => {
        await supabase.from('messages').delete().eq('channel_id', channelId);
        const { error } = await supabase.from('server_channels').delete().eq('id', channelId);

        if (error) {
          ajouterToast("Erreur lors de la suppression", "error");
        } else {
          ajouterToast("Salon supprimé !", "success");
          chargerChannels();
        }
      }
    );
  };

  const changerSlowmode = async (channelId, seconds) => {
    const { error } = await supabase
      .from('server_channels')
      .update({ slowmode_delay: seconds })
      .eq('id', channelId);

    if (error) {
      ajouterToast("Erreur lors de la modification du mode lent", "error");
    } else {
      ajouterToast(seconds === 0 ? "Mode lent désactivé" : `Mode lent défini sur ${seconds}s`, "success");
      chargerChannels();
    }
  };

  const viderChannel = async (channelId, channelName) => {
    demanderConfirmation(
      <span>
        Voulez-vous vraiment vider le salon <span className="font-black text-error">#{channelName}</span> ?
      </span>,
      async () => {
        const { error } = await supabase
          .from('messages') 
          .delete()
          .eq('channel_id', channelId);

        if (error) {
          console.error("Erreur Supabase:", error);
          ajouterToast("Erreur lors du nettoyage", "error");
        } else {
          ajouterToast(`Salon #${channelName} vidé !`, "success");
          
          await supabase.from('server_logs').insert({
            server_id: server.id,
            actor_id: session.user.id,
            action_type: 'clear_channel',
            details: `A vidé le salon #${channelName}`
          });
        }
      }
    );
  };


  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-base-100 rounded-2xl shadow-2xl w-full max-w-2xl mx-4 z-10 overflow-hidden flex animate-[modalIn_0.2s_ease_forwards]" style={{maxHeight: '85vh'}}>
        
        <div className="w-48 bg-base-200 p-3 flex flex-col gap-1 shrink-0">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 mb-2 truncate">{server.name}</div>
          {[
            { id: 'general', label: 'Général', icon: Settings, show: isAdmin },
            { id: 'channels', label: 'Salons', icon: Settings, show: isAdmin },
            { id: 'membres', label: 'Membres', icon: Users, show: true },
            { id: 'logs', label: 'Audit Logs', icon: Info, show: isAdmin },
          ].filter(o => o.show).map(o => (
            <button key={o.id} onClick={() => setOnglet(o.id)} className={`flex items-center gap-2 px-2 py-2 rounded-lg text-sm ${onglet === o.id ? 'bg-primary text-primary-content' : 'hover:bg-base-300'}`}>
              <o.icon size={15} /> {o.label}
            </button>
          ))}
          <div className="flex-1" />
          {estLeProprietaire 
            ? <button onClick={() => setShowDelModal(true)} className="btn btn-ghost btn-sm text-error hover:bg-error/10"><Trash2 size={15}/> Supprimer</button>
            : <button 
                onClick={() => demanderConfirmation("Voulez-vous vraiment quitter ce serveur ?", executerQuitter)} 
                className="btn btn-ghost btn-sm text-error hover:bg-error/10"
              >
                <LogOut size={15}/> Quitter
              </button>
          }
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold">Paramètres</h2>
            <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle"><X size={16}/></button>
          </div>

          {onglet === 'general' && <TabGeneral server={server} onUpdate={onServerUpdated} ajouterToast={ajouterToast} onClose={onClose} />}
          
          {onglet === 'membres' && <TabMembres membres={membres} monRole={monRole} session={session} onRoleChange={changerRole} onKick={(id, p) => ajouterToast("Kick non implémenté", "info")} />}

          {onglet === 'channels' && (
            <div className="flex flex-col gap-4">
              <div className="bg-base-200/50 p-4 rounded-xl border border-base-300">
                <h3 className="text-sm font-bold mb-3 uppercase tracking-wider text-base-content/70">Créer un salon</h3>
                <div className="flex flex-col gap-3">
                  <input 
                    className="input input-bordered input-sm w-full font-medium" 
                    value={newChannel} 
                    onChange={e => setNewChannel(e.target.value)} 
                    placeholder="Nom du salon (ex: annonces)" 
                  />
                  <div className="flex gap-2 items-center">
                    <select 
                      className="select select-bordered select-sm flex-1" 
                      value={newChannelRoles} 
                      onChange={e => setNewChannelRoles(e.target.value)}
                    >
                      <option value="all">Public</option>
                      <option value="mod">Modérateurs & Admins</option>
                      <option value="admin">Admins</option>
                    </select>
                    <button onClick={ajouterChannel} disabled={!newChannel.trim()} className="btn btn-primary btn-sm">
                      Créer
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mt-2">
                <h3 className="text-sm font-bold mb-2 uppercase tracking-wider text-base-content/70">Salons existants</h3>
                {channels.map(ch => (
  <div key={ch.id} className="bg-base-200 p-3 rounded-lg flex items-center justify-between border border-base-300 group">
    <div className="flex items-center gap-2 font-medium">
      <span className="text-gray-400">#</span> {ch.name}
    </div>
    
    <div className="flex items-center gap-1">
  <select 
    className="select select-bordered select-xs bg-base-100 mr-2 text-xs"
    value={ch.slowmode_delay || 0}
    onChange={(e) => changerSlowmode(ch.id, parseInt(e.target.value))}
    title="Mode lent"
  >
    <option value={0}>Désactivé</option>
    <option value={5}>5s</option>
    <option value={10}>10s</option>
    <option value={30}>30s</option>
    <option value={60}>1 min</option>
  </select>
      <button 
        onClick={() => viderChannel(ch.id, ch.name)}
        className="btn btn-ghost btn-xs btn-circle text-warning opacity-0 group-hover:opacity-100 transition-opacity"
        title="Vider les messages"
      >
        <Eraser size={14} />
      </button>

      <button 
        onClick={() => supprimerChannel(ch.id, ch.name)}
        className="btn btn-ghost btn-xs btn-circle text-error opacity-0 group-hover:opacity-100 transition-opacity"
        title="Supprimer le salon"
      >
        <Trash2 size={14} />
      </button>
    </div>
  </div>
))}
              </div>
            </div>
          )}

          {onglet === 'logs' && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between pb-2 border-b border-base-300">
                <h3 className="text-sm font-bold uppercase tracking-wider text-base-content/70">
                  Logs du serveur
                </h3>
                <button onClick={chargerLogs} className="btn btn-ghost btn-xs btn-circle" title="Rafraîchir">
                  <RefreshCw size={14} className={loadingLogs ? "animate-spin" : ""} />
                </button>
              </div>

              <div className="space-y-2">
                {loadingLogs ? (
                  <div className="text-center p-4 text-base-content/50 text-sm">Chargement des logs...</div>
                ) : logs.length === 0 ? (
                  <div className="text-center p-8 text-base-content/30 italic">Aucune action enregistrée pour le moment.</div>
                ) : (
                  logs.map(log => (
                    <div key={log.id} className="flex items-start gap-3 p-3 bg-base-200/50 rounded-xl border border-base-300 transition-colors hover:bg-base-200">
                      <img 
                        src={log.actor?.avatar_url || `https://ui-avatars.com/api/?name=${log.actor?.pseudo}&background=random`} 
                        className="w-8 h-8 rounded-full shadow-sm" 
                        alt="avatar"
                      />
                      <div className="flex-1 min-w-0 leading-tight">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="font-bold text-sm text-base-content truncate">{log.actor?.pseudo}</span>
                          <span className="text-[10px] text-base-content/40 whitespace-nowrap font-medium">
                            {new Date(log.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute:'2-digit' })}
                          </span>
                        </div>
                        <div className="text-xs text-base-content/70 flex items-center gap-1.5">
                          {log.action_type === 'delete_message' && <><Trash2 size={12} className="text-error" /> a supprimé un message</>}
                          {log.action_type === 'ban_user' && <><ShieldAlert size={12} className="text-error" /> a banni un membre</>}
                          {log.action_type === 'create_channel' && <><Plus size={12} className="text-success" /> a créé un salon</>}
                          {log.action_type === 'update_server' && <><Settings size={12} className="text-warning" /> a modifié le serveur</>}
                          
                          {!['delete_message', 'ban_user', 'create_channel', 'update_server'].includes(log.action_type) && 
                            <span>a effectué une action ({log.action_type})</span>
                          }
                        </div>
                        {log.details && (
                          <div className="text-[11px] font-mono mt-1.5 p-1.5 bg-base-300 rounded text-base-content/60 border border-base-300">
                            {log.details}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <ModaleSuppressionServeur server={server} isOpen={showDelModal} onClose={() => setShowDelModal(false)} onConfirm={executerSuppression} loading={delLoading} />
    </div>
  );
}