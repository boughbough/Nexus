import React, { useState } from 'react';
import { Plus, Image as ImageIcon, Upload, Loader2 } from 'lucide-react';
import { supabase } from './supabase';
import TagPicker from './TagPicker';

const CATEGORIES_DISPOS = ["Gaming", "Musique", "Art", "Technologie", "Études", "Social", "Cinéma", "Sport"];

export default function ModaleCreerServeur({
  isOpen,
  isClosingModal,
  fermerModal,
  session,
  pseudo,
  monProfil,
  servers,
  setServers,
  onSelectServer,
  ajouterToast
}) {
  const [nom, setNom] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [iconFile, setIconFile] = useState(null);
  const [iconPreview, setIconPreview] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);
  const [tagsSelectionnes, setTagsSelectionnes] = useState([]);
  const [loading, setLoading] = useState(false);

  if (!isOpen && !isClosingModal) return null;

  const resetFormLocal = () => {
    fermerModal();
    setTimeout(() => {
      setNom(''); setDescription('');
      setIconFile(null); setIconPreview(null);
      setBannerFile(null); setBannerPreview(null);
      setTagsSelectionnes([]);
    }, 200);
  };

  const creerServeur = async () => {
    if (!nom.trim()) return;
    setLoading(true);
    let icon_url = null; let banner_url = null;
    try {
      if (iconFile) {
        const ext = iconFile.name.split('.').pop();
        const iconPath = `servers/ico-${Date.now()}.${ext}`;
        const { error } = await supabase.storage.from('avatars').upload(iconPath, iconFile);
        if (!error) icon_url = supabase.storage.from('avatars').getPublicUrl(iconPath).data.publicUrl;
      }
      if (bannerFile) {
        const ext = bannerFile.name.split('.').pop();
        const bannerPath = `servers/ban-${Date.now()}.${ext}`;
        const { error } = await supabase.storage.from('avatars').upload(bannerPath, bannerFile);
        if (!error) banner_url = supabase.storage.from('avatars').getPublicUrl(bannerPath).data.publicUrl;
      }

      const { data: server, error } = await supabase.from('servers').insert({ 
        name: nom.trim(), description, is_public: isPublic, owner_id: session.user.id, icon_url, banner_url, tags: tagsSelectionnes 
      }).select().single();
      if (error) throw error;

      await supabase.from('server_members').insert({ server_id: server.id, user_id: session.user.id, pseudo, role: 'owner', position: servers.length });

      const { error: chErr } = await supabase.from('server_channels').insert([
        { server_id: server.id, name: 'accueil', position: 0 },
        { server_id: server.id, name: 'général', position: 1 },
      ]);
      if (chErr) ajouterToast('Erreur création salons', 'error');
      
      const { data: channel } = await supabase.from('server_channels').select('*').eq('server_id', server.id).order('position').limit(1).single();

      ajouterToast('Votre communauté est prête ! 🚀');
      setServers(prev => [...prev, server]);
      resetFormLocal();
      onSelectServer(server, channel);
    } catch (err) { 
      ajouterToast('Erreur : ' + err.message, 'error'); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
      <div className={`fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200 ${isClosingModal ? 'opacity-0' : 'opacity-100'}`} onClick={resetFormLocal} />
      <div className={`relative bg-base-100 rounded-3xl shadow-[0_20px_60px_-10px_rgba(0,0,0,0.3)] w-full max-w-4xl overflow-hidden flex flex-col md:flex-row transition-all duration-200 ease-out transform ${isClosingModal ? 'opacity-0 scale-95 translate-y-4' : 'animate-[modalIn_0.25s_ease_forwards] opacity-100 scale-100 translate-y-0'}`}>
        <div className="flex-1 p-8 overflow-y-auto border-r border-base-200" style={{maxHeight: '85vh'}}>
          <h2 className="text-2xl font-black mb-6 flex items-center gap-3"><div className="p-2 bg-success/20 text-success rounded-xl"><Plus size={24}/></div> Créer votre serveur</h2>
          <div className="space-y-6">
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Bannière (16:9)</label>
              <label className="cursor-pointer group relative block h-28 rounded-2xl bg-base-200 border-2 border-dashed border-base-300 hover:border-success transition-all overflow-hidden">
                {bannerPreview ? <img src={bannerPreview} className="w-full h-full object-cover" /> : <div className="h-full flex flex-col items-center justify-center text-gray-400"><ImageIcon size={20} className="mb-1 opacity-40"/><span className="text-[10px] font-bold">Ajouter une ambiance</span></div>}
                <input type="file" accept="image/*" className="hidden" onChange={e => { const f=e.target.files[0]; if(f){setBannerFile(f); setBannerPreview(URL.createObjectURL(f));} }} />
              </label>
            </div>
            <div className="flex gap-4 items-end">
              <label className="cursor-pointer group relative flex-shrink-0">
                <div className="w-16 h-16 rounded-2xl bg-base-200 flex items-center justify-center overflow-hidden border-2 border-dashed border-base-300 group-hover:border-success transition-all">
                  {iconPreview ? <img src={iconPreview} className="w-full h-full object-cover" /> : <Upload size={20} className="text-gray-400" />}
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={e => { const f=e.target.files[0]; if(f){setIconFile(f); setIconPreview(URL.createObjectURL(f));} }} />
              </label>
              <div className="flex-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Nom de la communauté *</label>
                <input type="text" className="input input-bordered w-full font-bold" value={nom} onChange={e=>setNom(e.target.value)} placeholder="Ex: Les Amis du Code" maxLength={50} autoFocus />
              </div>
            </div>
            <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Description</label><textarea className="textarea textarea-bordered w-full h-20 resize-none text-sm" value={description} onChange={e=>setDescription(e.target.value)} placeholder="De quoi parle votre serveur ?" maxLength={200}/></div>
            <div>
              <TagPicker 
                tags={tagsSelectionnes} 
                setTags={setTagsSelectionnes} 
                maxTags={5} 
              />
            </div>
            <div className="bg-base-200/50 p-4 rounded-2xl border border-base-300 flex items-center justify-between group hover:border-success/30 transition-colors">
              <div className="flex-1">
                <label className="text-sm font-bold flex items-center gap-2 transition-colors">
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
                className="toggle toggle-success" 
                checked={isPublic} 
                onChange={(e) => setIsPublic(e.target.checked)} 
              />
            </div>
            <button onClick={creerServeur} disabled={loading || !nom.trim()} className="w-full h-12 rounded-xl bg-base-100 border border-base-300 font-bold text-success shadow-[0_4px_12px_-2px_rgba(0,0,0,0.1)] hover:shadow-lg hover:border-success/30 hover:bg-success/5 transition-all">
              {loading ? <Loader2 className="animate-spin"/> : 'LANCER LA COMMUNAUTÉ'}
            </button>
          </div>
        </div>
        <div className="hidden md:flex w-80 bg-base-200 p-8 flex-col justify-center items-center relative overflow-hidden">
          <div className="absolute top-4 left-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] z-10">Aperçu</div>
          <div className="w-full bg-base-100 rounded-3xl shadow-[0_20px_60px_-10px_rgba(0,0,0,0.3)] border border-base-300 overflow-hidden flex flex-col relative z-10 transform scale-110">
            <div className="h-24 relative overflow-hidden flex-shrink-0 bg-base-300">
              {bannerPreview ? <img src={bannerPreview} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gradient-to-br from-primary to-secondary opacity-40"></div>}
            </div>
            <div className="relative p-4 pt-8">
              <div className="absolute -top-10 left-4 w-16 h-16 rounded-2xl bg-base-100 shadow-xl border-4 border-base-100 flex items-center justify-center overflow-hidden">
                {iconPreview ? <img src={iconPreview} className="w-full h-full object-cover" /> : <span className="font-black text-2xl text-primary">{nom ? nom[0].toUpperCase() : '?'}</span>}
              </div>
              <div className="font-black text-sm truncate mb-0.5">{nom || "Nom du serveur"}</div>
              <div className="text-[9px] font-bold opacity-40 uppercase mb-3">Par @{monProfil?.pseudo || "Vous"}</div>
              <p className="text-[10px] text-gray-500 line-clamp-2 leading-tight mb-3 italic">{description || "Votre future description ici..."}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}