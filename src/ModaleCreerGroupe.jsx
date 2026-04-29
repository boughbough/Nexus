import React, { useState } from 'react';
import { FolderPlus, Loader2 } from 'lucide-react';
import { supabase } from './supabase';

export default function ModaleCreerGroupe({
  isOpen,
  isClosingModal,
  fermerModal,
  session,
  servers,
  groups,
  setGroups,
  ajouterToast
}) {
  const [newGroupName, setNewGroupName] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen && !isClosingModal) return null;

  const handleClose = () => {
    fermerModal();
    setTimeout(() => setNewGroupName(''), 200);
  };

  const creerGroupe = async () => {
    if (!newGroupName.trim()) return;
    setLoading(true);
    try {
      const position = groups.length;
      const { data, error } = await supabase.from('server_groups').insert({
        user_id: session.user.id,
        name: newGroupName.trim(),
        position
      }).select().single();
      
      if (error) throw error;
      
      setGroups(prev => [...prev, data]);
      ajouterToast('Dossier créé !', 'success');
      handleClose();
    } catch (err) {
      ajouterToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
      <div className={`fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200 ${isClosingModal ? 'opacity-0' : 'opacity-100'}`} onClick={handleClose} />
      <div className={`relative bg-base-100 rounded-3xl shadow-2xl w-full max-w-sm p-6 transform transition-all duration-200 ${isClosingModal ? 'opacity-0 scale-95 translate-y-4' : 'animate-[modalIn_0.2s_ease_forwards] opacity-100 scale-100 translate-y-0'}`}>
        <h3 className="text-xl font-black mb-3 flex items-center gap-3">
          <div className="p-2 bg-primary/20 text-primary rounded-xl"><FolderPlus size={20}/></div> 
          Nouveau Dossier
        </h3>
        <p className="text-xs text-gray-500 mb-6">Regroupez vos serveurs pour mieux vous organiser.</p>
        
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Nom du dossier *</label>
        <input 
          type="text" 
          className="input input-bordered w-full mb-6 focus:border-primary transition-colors" 
          placeholder="Ex: Gaming, Études..." 
          value={newGroupName} 
          onChange={e => setNewGroupName(e.target.value)} 
          onKeyDown={e => e.key === 'Enter' && creerGroupe()} 
          autoFocus 
        />
        
        <button onClick={creerGroupe} disabled={loading || !newGroupName.trim()} className="btn btn-primary w-full h-12 rounded-xl font-bold shadow-md text-sm transition-all active:scale-95">
          {loading ? <Loader2 className="animate-spin" /> : 'Créer le dossier'}
        </button>
      </div>
    </div>
  );
}