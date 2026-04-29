import React, { useState, useEffect } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { supabase } from './supabase';
import TagPicker from './TagPicker';

export default function TabGeneral({ server, onUpdate, ajouterToast, onClose }) {
  const [loading, setLoading] = useState(false);
  const [nom, setNom] = useState(server.name);
  const [description, setDescription] = useState(server.description || '');
  const [isPublic, setIsPublic] = useState(server.is_public);

  
  
  const [tagsArray, setTagsArray] = useState(Array.isArray(server.tags) ? server.tags : []);

  const [iconPreview, setIconPreview] = useState(server.icon_url);
  const [bannerPreview, setBannerPreview] = useState(server.banner_url);
  const [files, setFiles] = useState({ icon: null, banner: null });

  useEffect(() => {
    setNom(server.name);
    setDescription(server.description || '');
    setIsPublic(server.is_public);
    setTagsArray(Array.isArray(server.tags) ? server.tags : []);
  }, [server]);

  const sauvegarder = async () => {
    setLoading(true);
    let urls = { icon: server.icon_url, banner: server.banner_url };

    try {
      const tagsNettoyes = tagsArray.map(t => t.trim()).filter(t => t !== "");

      for (const type of ['icon', 'banner']) {
        if (files[type]) {
          const ext = files[type].name.split('.').pop();
          const path = `servers/${server.id}-${type}-${Date.now()}.${ext}`;
          await supabase.storage.from('avatars').upload(path, files[type]);
          urls[type] = supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl;
        }
      }

      const { data, error } = await supabase.from('servers').update({ 
        name: nom, 
        description, 
        is_public: isPublic, 
        tags: tagsArray 
      }).eq('id', server.id).select();

      if (error) {
        console.error("Erreur Supabase détaillée:", error);
        throw error;
      }

      console.log("Données sauvegardées avec succès:", data);
      ajouterToast('Serveur mis à jour !');
      
      setTimeout(() => {
        onClose();
      }, 0);
      
      onUpdate({ 
        ...server, 
        name: nom, 
        description, 
        is_public: isPublic, 
        icon_url: urls.icon, 
        banner_url: urls.banner,
        tags: tagsArray 
      });
    } catch (e) {
      ajouterToast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
        if (e.target.tagName === 'TEXTAREA' && !e.ctrlKey) return;

        if (document.querySelector('.z-\\[600\\]')) return;

        e.preventDefault();
        if (!loading) sauvegarder();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [loading, nom, description, isPublic, tagsArray, files]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Bannière</label>
        <label className="cursor-pointer group relative block w-full h-32 rounded-2xl bg-base-200 border-2 border-dashed border-base-300 hover:border-primary overflow-hidden">
          {bannerPreview ? <img src={bannerPreview} className="w-full h-full object-cover" /> : <div className="h-full flex flex-col items-center justify-center text-gray-400"><Upload size={24} /><span className="text-xs">16:9</span></div>}
          <input type="file" className="hidden" onChange={e => { const f=e.target.files[0]; if(f){ setFiles(p=>({...p, banner:f})); setBannerPreview(URL.createObjectURL(f)); }}} />
        </label>
      </div>

      <div className="flex gap-4 items-center">
        <label className="cursor-pointer w-20 h-20 rounded-2xl bg-base-200 border border-base-300 flex items-center justify-center overflow-hidden">
          {iconPreview ? <img src={iconPreview} className="w-full h-full object-cover" /> : <span className="text-2xl font-bold">{nom?.[0]}</span>}
          <input type="file" className="hidden" onChange={e => { const f=e.target.files[0]; if(f){ setFiles(p=>({...p, icon:f})); setIconPreview(URL.createObjectURL(f)); }}} />
        </label>
        <div className="flex-1">
          <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Nom du serveur</label>
          <input className="input input-bordered w-full" value={nom} onChange={e => setNom(e.target.value)} />
        </div>
      </div>

      <div>
        <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Description</label>
        <textarea className="textarea textarea-bordered w-full" rows={3} value={description} onChange={e => setDescription(e.target.value)} />
<div className="form-control w-full mb-4">
  <TagPicker 
    tags={tagsArray} 
    setTags={setTagsArray} 
    maxTags={5} 
  />
</div>
      <div className="bg-base-200/50 p-4 rounded-2xl border border-base-300 flex items-center justify-between group hover:border-primary/30 transition-colors">
        <div className="flex-1">
          <label className="text-sm font-bold flex items-center gap-2">
             {isPublic ? '🌍 Serveur Public' : '🔒 Serveur Privé'}
          </label>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">
            {isPublic 
              ? "Visible par tout le monde dans l'explorateur" 
              : "Uniquement accessible via un code d'invitation"}
          </p>
        </div>
        <input 
          type="checkbox" 
          className="toggle toggle-primary" 
          checked={isPublic} 
          onChange={(e) => setIsPublic(e.target.checked)} 
        />
      </div>

      <div className="pt-4">
        <button onClick={sauvegarder} disabled={loading || !nom.trim()} className="btn btn-primary w-full shadow-lg">
          {loading ? <Loader2 className="animate-spin"/> : 'Enregistrer les modifications'}
          <kbd className="kbd kbd-xs bg-white/20 ml-2">↵</kbd>
        </button>
      </div>
      </div>


    </div>
  );
}