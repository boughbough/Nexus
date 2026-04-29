import React, { useState } from 'react';
import { Compass, Loader2 } from 'lucide-react';
import { supabase } from './supabase';

export default function ModaleRejoindreServeur({
  isOpen,
  isClosingModal,
  fermerModal,
  session,
  pseudo,
  servers,
  setServers,
  onSelectServer,
  ajouterToast
}) {
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen && !isClosingModal) return null;

  const handleClose = () => {
    fermerModal();
    setTimeout(() => setInviteCode(''), 200); 
  };

  const rejoindreServeur = async () => {
    if (!inviteCode.trim()) return;
    setLoading(true);
    
    try {
      const codePropre = inviteCode.replace(/\s/g, '').trim();


      const { data: server, error: searchError } = await supabase
        .from('servers')
        .select('*')
        .ilike('invite_code', codePropre)
        .maybeSingle();

      if (!server) throw new Error('Désolé, ce code est invalide ou expiré.');

      if (searchError) throw searchError;

      const dejaMembre = servers.some(s => s.id === server.id);
      if (dejaMembre) throw new Error('Vous êtes déjà membre de ce serveur.');

      const { error: joinErr } = await supabase.from('server_members').insert({ 
        server_id: server.id, user_id: session.user.id, pseudo, role: 'member', position: servers.length 
      });
      if (joinErr) throw joinErr;

      const { data: firstChannel } = await supabase.from('server_channels').select('*').eq('server_id', server.id).order('position').limit(1).maybeSingle();

      setServers(prev => [...prev, server]);
      ajouterToast(`Vous avez rejoint ${server.name} !`, 'success');
      handleClose();
      onSelectServer(server, firstChannel || null);

    } catch (err) {
      ajouterToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
      <div className={`fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200 ${isClosingModal ? 'opacity-0' : 'opacity-100'}`} onClick={handleClose} />
      <div className={`relative bg-base-100 rounded-3xl shadow-2xl w-full max-w-md p-8 transform transition-all duration-200 ${isClosingModal ? 'opacity-0 scale-95 translate-y-4' : 'animate-[modalIn_0.2s_ease_forwards] opacity-100 scale-100 translate-y-0'}`}>
        <h3 className="text-2xl font-black mb-3 flex items-center gap-3">
          <div className="p-2 bg-primary/20 text-primary rounded-xl"><Compass size={24}/></div> 
          Rejoindre un serveur
        </h3>
        <p className="text-sm text-gray-500 mb-8 leading-relaxed">Entrez le code d'invitation ci-dessous pour rejoindre une communauté existante.</p>
        
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Code d'invitation *</label>
        <input 
          type="text" 
          className="input input-bordered w-full mb-6 font-mono text-center tracking-[0.2em] uppercase focus:border-primary transition-colors" 
          placeholder="Ex: 123e4567-e89b..." 
          value={inviteCode} 
          onChange={e => setInviteCode(e.target.value)} 
          onKeyDown={e => e.key === 'Enter' && rejoindreServeur()} 
          autoFocus 
        />
        
        <button onClick={rejoindreServeur} disabled={loading || !inviteCode.trim()} className="btn btn-primary w-full h-12 rounded-xl font-bold shadow-md text-base transition-all active:scale-95">
          {loading ? <Loader2 className="animate-spin" /> : 'Rejoindre la communauté'}
        </button>
      </div>
    </div>
  );
}