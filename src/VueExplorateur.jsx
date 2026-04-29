import React from 'react';
import { Search, Loader2 ,Users} from 'lucide-react';

const getBannerGradient = (name) => {
  const gradients = [
    'from-indigo-500 to-purple-600',
    'from-blue-400 to-emerald-400',
    'from-orange-400 to-rose-400',
    'from-slate-500 to-slate-800',
    'from-amber-200 to-yellow-500',
    'from-cyan-500 to-blue-500',
  ];
  const index = name.length % gradients.length;
  return gradients[index];
};

export default function VueExplorateur({
  rechercheExplorer,
  setRechercheExplorer,
  explorerLoading,
  publicServers,
  servers,
  rejoindreServeurPublic
}) {

    const serveursTries = [...publicServers].sort((a, b) => {
    const membresA = a.server_members?.[0]?.count || 0;
    const membresB = b.server_members?.[0]?.count || 0;
    return membresB - membresA;
  });

  const serveursFiltres = serveursTries.filter(srv => {
    const query = rechercheExplorer.toLowerCase();
    
    const nomMatch = srv.name?.toLowerCase().includes(query);
    
    const tagsMatch = Array.isArray(srv.tags) && srv.tags.some(tag => 
      tag.toLowerCase().includes(query)
    );

    return nomMatch || tagsMatch;
  });

  const serveursAffiches = rechercheExplorer.trim() === "" 
    ? serveursFiltres.slice(0, 9) 
    : serveursFiltres;

  return (
    <div className="flex-1 flex flex-col bg-base-100 animate-fade-in overflow-y-auto">
      <div className="h-48 flex-shrink-0 bg-primary relative flex flex-col items-center justify-center text-primary-content p-6 text-center">
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <h1 className="text-3xl font-black mb-2 relative z-10">Trouvez votre communauté</h1>
        <p className="max-w-md opacity-90 relative z-10">Découvrez des serveurs publics et rejoignez des gens qui partagent vos passions.</p>
        
        <div className="mt-6 w-full max-w-xl relative z-10">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 opacity-50" size={20} />
          <input 
            type="text" 
            placeholder="Rechercher un serveur..." 
            className="input input-bordered w-full pl-12 h-14 text-lg text-base-content shadow-xl rounded-2xl"
            value={rechercheExplorer}
            onChange={e => setRechercheExplorer(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 p-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-xl font-bold mb-6">Serveurs recommandés</h2>
          {explorerLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={48} /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {serveursAffiches.map(srv => {
                  const dejaMembre = servers.some(s => s.id === srv.id);
                  const dateCreation = new Date(srv.created_at);
                  const ilYa = Math.floor((new Date() - dateCreation) / (1000 * 60 * 60 * 24));
                  const labelAnciennete = ilYa === 0 ? "Créé aujourd'hui" : `Créé il y a ${ilYa} jours`;

                  return (
                    <div key={srv.id} className="group relative bg-base-200 rounded-2xl shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border border-base-300 overflow-hidden flex flex-col h-[380px]">
                      <div className="relative flex-shrink-0">
                        <div className="h-32 bg-base-300 relative overflow-hidden">
                          {srv.banner_url ? (
                            <img src={srv.banner_url} className="w-full h-full object-cover" alt="Bannière" />
                          ) : 
                          srv.icon_url ? (
                            <img src={srv.icon_url} className="w-full h-full object-cover blur-md opacity-40 scale-110" alt="Fond" />
                          ) : (
                            <div className={`w-full h-full bg-gradient-to-br ${getBannerGradient(srv.name)} opacity-80`}></div>
                          )}
                          
                        </div>
                        <div className="absolute -bottom-6 left-6 z-10">
                          <div className="w-20 h-20 rounded-2xl bg-base-100 shadow-2xl border-4 border-base-100 flex items-center justify-center overflow-hidden transition-transform group-hover:scale-105 duration-500">
                            {srv.icon_url ? (
                              <img src={srv.icon_url} className="w-full h-full object-cover" alt={srv.name} />
                            ) : (
                              <span className="font-black text-3xl text-primary">{srv.name[0].toUpperCase()}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="p-6 pt-10 flex-1 flex flex-col">
                        <h3 className="font-black text-lg truncate group-hover:text-primary transition-colors">{srv.name}</h3>
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-[11px] font-bold opacity-60 uppercase tracking-widest">
                            Par <span className="text-primary">@{srv.profiles?.pseudo || 'Anonyme'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 bg-base-300/50 px-2 py-1 rounded-md border border-base-200" title="Nombre de membres">
                            <Users size={12} className="text-primary" />
                            <span>{srv.server_members?.[0]?.count || 0}</span>
                          </div>
                        </div>
                        <p className="text-xs text-base-content/70 line-clamp-3 leading-relaxed mb-4 flex-1">
                          {srv.description || "Aucune description fournie."}
                        </p>
                        {Array.isArray(srv.tags) && srv.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-4">
                            {srv.tags.map((tag, idx) => (
                              <span 
                                key={idx} 
                                className="text-[9px] font-black uppercase bg-success/10 text-success px-2 py-1 rounded-md border border-success/20 shadow-sm"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center justify-between border-t border-base-300 pt-4 mt-auto">
                          <span className="text-[10px] font-bold opacity-40 uppercase">{labelAnciennete}</span>
                          {dejaMembre ? (
                            <div className="badge badge-success badge-outline gap-1.5 py-3 font-bold text-[10px]">✓ MEMBRE</div>
                          ) : (
                            <button 
                              onClick={() => rejoindreServeurPublic(srv)} 
                              className="btn btn-primary btn-sm rounded-xl px-5 shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
                            >
                              Rejoindre
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}