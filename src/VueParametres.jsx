import React, { useEffect } from 'react';
import { User, Palette, Settings, Compass, ArrowLeft, Loader2, Upload, ShieldAlert } from 'lucide-react';
import { supabase } from './supabase';

const STATUTS = {
  en_ligne:  { label: 'En ligne',  dot: 'bg-success',  text: 'text-success' },
  occupe:    { label: 'Occupé',    dot: 'bg-warning',  text: 'text-warning' },
  absent:    { label: 'Absent',    dot: 'bg-error',    text: 'text-error'   },
  invisible: { label: 'Invisible', dot: 'bg-gray-400', text: 'text-gray-400'},
};

const LISTE_THEMES = ["dark", "light", "cupcake", "synthwave", "retro", "cyberpunk", "dracula", "night"];

export default function VueParametres({
  session, monProfil, monPseudoAffiche, setVueActive, ongletParametres, setOngletParametres, editPseudo, setEditPseudo, editBio, setEditBio, editStatut, setEditStatut, editAvatarUrl, editPassword, setEditPassword, uploadAvatarEnCours, sauvegardeEnCours, avatarInputRef, handleAvatarUpload, sauvegarderParametres, changerMotDePasse, supprimerMonCompte, getAvatarUrlForDisplay, serverPrecedent, setServerActuel, setServerPrecedent, themeActuel, setThemeActuel, demanderConfirmation,
  blockedUsers, chargerBlocages, profilsCache, ajouterToast
}) {

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
        if (ongletParametres === 'profil') {
          if (e.target.tagName === 'TEXTAREA' && !e.ctrlKey) return;
          e.preventDefault();
          if (!sauvegardeEnCours) sauvegarderParametres();
        } 
        else if (ongletParametres === 'compte' && editPassword.length >= 6) {
          e.preventDefault();
          if (!sauvegardeEnCours) changerMotDePasse();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [ongletParametres, sauvegardeEnCours, editPseudo, editBio, editPassword]);

  const isLengthValid = editPassword.length >= 8;
  const hasUpperAndLower = /[a-z]/.test(editPassword) && /[A-Z]/.test(editPassword);
  const hasNumber = /[0-9]/.test(editPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(editPassword);
  
  const isPasswordValid = isLengthValid && hasUpperAndLower && hasNumber && hasSpecial;
  
  return (
    <div className="fixed inset-0 z-[300] flex w-full h-full bg-base-100 animate-fade-in">
      <div className="w-64 bg-base-200/50 border-r border-base-200 p-6 flex flex-col gap-2">
        <h2 className="text-xl font-bold mb-6">Paramètres</h2>
        <button onClick={() => setOngletParametres('profil')} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${ongletParametres === 'profil' ? 'bg-primary text-primary-content font-bold shadow-md' : 'hover:bg-base-300 text-base-content/70'}`}>
          <User size={18} /> Profil Public
        </button>
        <button onClick={() => setOngletParametres('apparence')} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${ongletParametres === 'apparence' ? 'bg-primary text-primary-content font-bold shadow-md' : 'hover:bg-base-300 text-base-content/70'}`}>
          <Palette size={18} /> Apparence
        </button>
        
        <button onClick={() => setOngletParametres('bloques')} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${ongletParametres === 'bloques' ? 'bg-primary text-primary-content font-bold shadow-md' : 'hover:bg-base-300 text-base-content/70'}`}>
          <ShieldAlert size={18} /> Utilisateurs bloqués
        </button>

        <button onClick={() => setOngletParametres('compte')} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${ongletParametres === 'compte' ? 'bg-primary text-primary-content font-bold shadow-md' : 'hover:bg-base-300 text-base-content/70'}`}>
          <Settings size={18} /> Mon Compte
        </button>
        
        <button onClick={() => window.dispatchEvent(new CustomEvent('start-app-guide'))} className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:bg-base-300 text-base-content/70 mt-4 border border-base-300">
          <Compass size={18} /> Relancer le guide
        </button>
        <div className="flex-1"></div>
        <button onClick={() => { 
            setVueActive('chat');
            if (serverPrecedent) { setServerActuel(serverPrecedent); setServerPrecedent(null); }
          }} className="flex items-center gap-2 btn btn-ghost text-gray-500 hover:text-base-content w-full justify-start">
          <ArrowLeft size={18} /> Retour au chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-10 bg-base-100">
        <div className="max-w-2xl mx-auto">
          {ongletParametres === 'profil' && (
            <div className="animate-fade-in">
              <h3 className="text-3xl font-extrabold mb-8">Profil Public</h3>
              
              <div className="flex items-center gap-6 mb-10 bg-base-200/50 p-6 rounded-2xl border border-base-200">
                <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current.click()}>
                  <img src={editAvatarUrl || getAvatarUrlForDisplay(monPseudoAffiche)} className="w-28 h-28 rounded-full border-4 border-base-100 shadow-md object-cover" alt="Avatar" />
                  <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    {uploadAvatarEnCours ? <Loader2 className="animate-spin text-white" /> : <Upload className="text-white" />}
                  </div>
                  <input type="file" accept="image/*" className="hidden" ref={avatarInputRef} onChange={handleAvatarUpload} />
                </div>
                <div>
                  <h4 className="font-bold text-lg mb-1">Photo de profil</h4>
                  <p className="text-sm text-gray-500 mb-3">Une image vaut mille mots. Cliquez pour la modifier.</p>
                  <button onClick={() => avatarInputRef.current.click()} className="btn btn-sm btn-outline">Changer d'avatar</button>
                </div>
              </div>

              <div className="form-control mb-8">
                <label className="label"><span className="label-text font-bold text-lg">Nom d'affichage (Pseudo)</span></label>
                <br /><input type="text" className="input input-lg input-bordered bg-base-200/50 focus:bg-base-100 transition-colors" value={editPseudo} onChange={e => setEditPseudo(e.target.value)} />
                <br /><label className="label"><span className="label-text-alt text-gray-500">C'est sous ce nom que les autres vous verront.</span></label>
              </div>

              <div className="form-control mb-8">
                <label className="label"><span className="label-text font-bold text-lg">Statut Actuel</span></label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(STATUTS).map(([key, s]) => (
                    <button key={key} onClick={() => setEditStatut(key)}
                      className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all text-sm font-bold ${editStatut === key ? 'border-primary bg-primary/10 text-primary scale-[1.02]' : 'border-base-300 hover:border-base-content/30 text-base-content hover:bg-base-200/50'}`}>
                      <span className={`w-3 h-3 rounded-full flex-shrink-0 ${s.dot}`} /> {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-control mb-10">
                <label className="label"><span className="label-text font-bold text-lg">À propos de moi (Bio)</span></label>
                <br /><textarea className="textarea textarea-bordered bg-base-200/50 focus:bg-base-100 transition-colors text-base h-28 resize-none" maxLength={200} value={editBio} onChange={e => setEditBio(e.target.value)} placeholder="Un petit mot sur vous..."></textarea>
                <label className="label"><span className="label-text-alt">{editBio.length}/200 caractères</span></label>
              </div>

              <div className="border-t border-base-200 pt-8 flex gap-4">
                <button onClick={sauvegarderParametres} disabled={sauvegardeEnCours} className="btn btn-primary btn-lg shadow-md">
                  {sauvegardeEnCours ? <Loader2 className="animate-spin" /> : "Enregistrer les modifications"}
                  <kbd className="kbd kbd-xs bg-white/20 ml-2">↵</kbd>
                </button>
                <button onClick={() => setVueActive('chat')} className="btn btn-ghost btn-lg">Annuler</button>
              </div>
            </div>
          )}

          {ongletParametres === 'apparence' && (
            <div className="animate-fade-in">
              <h3 className="text-3xl font-extrabold mb-8">Apparence & Thème</h3>
              <p className="text-gray-500 mb-8">Personnalisez l'interface pour qu'elle corresponde à vos goûts.</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {LISTE_THEMES.map(theme => (
                  <button key={theme} onClick={() => setThemeActuel(theme)} data-theme={theme}
                    className={`border-4 rounded-2xl p-5 flex flex-col gap-3 transition-all hover:scale-[1.03] active:scale-95 ${themeActuel === theme ? 'border-primary shadow-xl bg-base-200' : 'border-transparent shadow-sm bg-base-100 hover:shadow-md'}`}>
                    <div className="font-bold text-base-content capitalize text-lg">{theme}</div>
                    <div className="flex gap-2">
                      <div className="w-5 h-5 rounded-full bg-primary shadow-sm"></div>
                      <div className="w-5 h-5 rounded-full bg-secondary shadow-sm"></div>
                      <div className="w-5 h-5 rounded-full bg-accent shadow-sm"></div>
                      <div className="w-5 h-5 rounded-full bg-neutral shadow-sm"></div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {ongletParametres === 'compte' && (
            <div className="animate-fade-in">
              <h3 className="text-3xl font-extrabold mb-8">Mon Compte</h3>
              
              <div className="form-control mb-8 bg-base-200/50 p-6 rounded-2xl border border-base-200">
                <label className="label"><span className="label-text font-bold text-lg">Adresse E-mail</span></label>
                <br /><input type="text" className="input input-lg input-bordered bg-base-300 text-gray-500 cursor-not-allowed" value={session.user.email} readOnly />
                <label className="label"><span className="label-text-alt text-gray-500">L'adresse e-mail n'est pas modifiable.</span></label>
              </div>

              <div className="border border-base-300 rounded-2xl p-8 mb-10 bg-base-100 shadow-sm">
                <h4 className="font-bold text-xl mb-6">Changer de mot de passe</h4>
                <div className="flex flex-col gap-4">
                  <input 
                    type="password" 
                    placeholder="Nouveau mot de passe" 
                    className="input input-lg input-bordered bg-base-200/50 focus:bg-base-100" 
                    value={editPassword} 
                    onChange={e => setEditPassword(e.target.value)} 
                  />
                  
                  <div className="flex flex-col gap-2 p-4 bg-base-300/30 rounded-xl text-sm font-medium mt-2">
                    <span className={`transition-colors duration-300 ${isLengthValid ? 'text-success' : 'text-base-content/40'}`}>
                      {isLengthValid ? '✓' : '○'} Au moins 8 caractères
                    </span>
                    <span className={`transition-colors duration-300 ${hasUpperAndLower ? 'text-success' : 'text-base-content/40'}`}>
                      {hasUpperAndLower ? '✓' : '○'} Majuscule et minuscule
                    </span>
                    <span className={`transition-colors duration-300 ${hasNumber ? 'text-success' : 'text-base-content/40'}`}>
                      {hasNumber ? '✓' : '○'} Au moins un chiffre
                    </span>
                    <span className={`transition-colors duration-300 ${hasSpecial ? 'text-success' : 'text-base-content/40'}`}>
                      {hasSpecial ? '✓' : '○'} Caractère spécial (!@#$...)
                    </span>
                  </div>

                  <button 
                    onClick={changerMotDePasse} 
                    disabled={sauvegardeEnCours || !isPasswordValid} 
                    className="btn btn-neutral btn-lg w-fit mt-2"
                  >
                    Mettre à jour le mot de passe
                    <kbd className="kbd kbd-xs bg-white/20 ml-2">↵</kbd>
                  </button>
                </div>
              </div>

              <div className="border-2 border-error/40 bg-error/5 rounded-2xl p-6 shadow-sm">
                <div>
                  <h4 className="font-bold text-lg text-error flex items-center gap-2 mb-2"><ShieldAlert size={20}/> Zone de Danger</h4>
                  <p className="text-sm text-base-content/70 mb-5 leading-relaxed">La suppression est <strong>permanente et irréversible</strong>. Votre profil, avatar et tous vos messages seront effacés de la base de données. Votre compte ne pourra pas être récupéré.</p>
                  <button
                    onClick={() => demanderConfirmation(
                      "Cette action est irréversible. Votre compte et toutes vos données seront supprimés définitivement.",
                      supprimerMonCompte
                    )}
                    className="btn btn-error w-full text-white font-bold text-base py-3 h-auto shadow-lg border-2 border-error hover:bg-error/80 active:scale-95 transition-all">
                    <ShieldAlert size={18} /> Supprimer mon compte définitivement
                  </button>
                </div>
              </div>
            </div>
          )}

          {ongletParametres === 'bloques' && (
            <div className="animate-fade-in">
              <h3 className="text-3xl font-extrabold mb-8">Utilisateurs bloqués</h3>
              <p className="text-gray-500 mb-8">Gérez ici la liste des personnes que vous avez bloquées. Ils ne peuvent plus vous envoyer de messages privés et leurs messages dans les serveurs sont masqués par défaut.</p>
              
              <div className="flex flex-col gap-4">
                {blockedUsers.length === 0 ? (
                  <div className="bg-base-200/50 p-12 rounded-3xl border-2 border-dashed border-base-300 text-center">
                    <ShieldAlert size={48} className="mx-auto mb-4 opacity-10" />
                    <p className="text-gray-400 font-medium italic">Votre liste noire est vide.</p>
                  </div>
                ) : (
                  blockedUsers.map(id => {
                    const p = profilsCache[id];
                    return (
                      <div key={id} className="flex items-center justify-between p-4 bg-base-200/50 rounded-2xl border border-base-200 hover:bg-base-200 transition-colors group">
                        <div className="flex items-center gap-4">
                          <img src={getAvatarUrlForDisplay(p?.pseudo || id)} className="w-12 h-12 rounded-full object-cover border-2 border-base-100" alt="Avatar" />
                          <div>
                            <div className="font-bold">{p?.pseudo || "Utilisateur inconnu"}</div>
                          </div>
                        </div>
                        <button 
                          onClick={async () => {
                            const { error } = await supabase.from('blocked_users').delete().match({ blocker_id: session.user.id, blocked_id: id });
                            if (!error) {
                              ajouterToast("Utilisateur débloqué", "success");
                              chargerBlocages();
                            }
                          }}
                          className="btn btn-error btn-outline btn-sm opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          Débloquer
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}