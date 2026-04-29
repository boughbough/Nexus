import React, { useState, useEffect } from 'react';
import { Trash2, X, Loader2 } from 'lucide-react';

export default function ModaleSuppressionServeur({ server, isOpen, onClose, onConfirm, loading }) {
  const [etape, setEtape] = useState(1);
  const [codeConfirmation] = useState(Math.random().toString(36).substring(2, 7).toUpperCase());
  const [saisie, setSaisie] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault(); 

        if (etape === 1) {
          setEtape(2);
        } else if (etape === 2) {
          if (saisie === codeConfirmation) {
            setEtape(3);
          }
        } else if (etape === 3) {
          if (!loading) {
            onConfirm();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, etape, saisie, codeConfirmation, loading, onConfirm, onClose]);

  useEffect(() => {
    if (isOpen) {
      setEtape(1);
      setSaisie('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-md transition-opacity" onClick={onClose} />
      <div className="relative bg-base-100 rounded-3xl shadow-2xl w-full max-w-md p-6 z-10 animate-[modalIn_0.2s_ease_forwards] border border-error/20">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black text-error flex items-center gap-2"><Trash2 size={24} /> Suppression</h2>
          <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle"><X size={16}/></button>
        </div>

        {etape === 1 && (
          <div className="space-y-4">
            <p className="text-sm">Voulez-vous vraiment supprimer <strong className="font-black text-error">{server.name}</strong> ? Cette action est irréversible.</p>
            <div className="flex gap-3 justify-end mt-8">
              <button onClick={onClose} className="btn btn-ghost">Annuler</button>
              <button onClick={() => setEtape(2)} className="btn btn-error text-white font-bold">
                Continuer <kbd className="kbd kbd-xs bg-white/20 ml-2">↵</kbd>
              </button>
            </div>
          </div>
        )}

        {etape === 2 && (
          <div className="space-y-4">
            <p className="text-sm">Veuillez recopier ce code de sécurité :</p>
            <div className="bg-base-300 p-4 rounded-xl text-center text-3xl font-black tracking-[0.3em]">{codeConfirmation}</div>
            <input type="text" className="input input-bordered w-full text-center text-xl font-bold uppercase" 
                   value={saisie} onChange={(e) => setSaisie(e.target.value.toUpperCase())} autoFocus />
            <div className="flex gap-3 justify-end mt-8">
              <button onClick={() => setEtape(1)} className="btn btn-ghost">Retour</button>
              <button onClick={() => setEtape(3)} disabled={saisie !== codeConfirmation} className="btn btn-error text-white font-bold">
                Continuer <kbd className="kbd kbd-xs bg-white/20 ml-2">↵</kbd>
              </button>
            </div>
          </div>
        )}

        {etape === 3 && (
          <div className="space-y-4 text-center">
            <h3 className="text-2xl font-black">C'est votre dernier mot ?</h3>
            <p className="text-sm text-gray-500">Une fois validé, toutes les données seront perdues à jamais.</p>
            <div className="flex flex-col gap-3 mt-8">
              <button onClick={onConfirm} disabled={loading} className="btn btn-error w-full text-white font-black">
                {loading ? <Loader2 className="animate-spin" /> : 'OUI.'}
                <kbd className="kbd kbd-xs bg-white/20 ml-2">↵</kbd>
              </button>
              <button onClick={onClose} className="btn btn-ghost text-xs">Non, je change d'avis ! <span className="opacity-50 ml-1">(Echap)</span></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}