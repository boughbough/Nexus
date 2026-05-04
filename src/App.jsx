import { useState, useEffect, useRef, useLayoutEffect } from 'react'
import MessageItem from './MessageItem'
import EmojiPicker from './EmojiPicker'
import ServerSidebar from './ServerSidebar'
import ServerView from './ServerView'
import { Clock, Compass , Copy, Send, Hash, Users, Info, UserPlus, LogOut, Atom, Trash, Pencil, Smile, Reply, X, ArrowDown, ImagePlus, Loader2, MessageCircle, Search, Settings, User, Palette, ShieldAlert, Upload, ArrowLeft, FileText, FileVideo, File, Music, Menu, Import} from 'lucide-react'
import { supabase } from './supabase'
import ReactMarkdown from 'react-markdown' 

import LandingPage from './LandingPage'
import VueParametres from './VueParametres'
import VueExplorateur from './VueExplorateur'
import HubAmis from './HubAmis'
import ZoneSaisie from './ZoneSaisie'
import SidebarDMs from './SidebarDMs';
import ProfilPopover from './ProfilPopover';

import AppProvider from './AppProvider';
import QuickSwitcher from './QuickSwitcher';
import DragDropOverlay from './DragDropOverlay';

import { useUI } from './contexts/UIContext';

import { useCommandes } from './useCommandes';

const MobileOverlay = () => {
  const { menuMobileOuvert, fermerMenuMobile, ajouterToast } = useUI();
  if (!menuMobileOuvert) return null;
  return <div className="md:hidden fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm" onClick={fermerMenuMobile} />;
};

const BurgerButton = () => {
  const { toggleMenuMobile } = useUI();
  return (
    <button className="md:hidden btn btn-ghost btn-sm btn-circle mr-1" onClick={toggleMenuMobile}>
      <Menu size={20} />
    </button>
  );
};

export default function App() {
  const [nouveauMessage, setNouveauMessage] = useState("");
  const [mentionQuery, setMentionQuery] = useState(null);
  const [mentionIndex, setMentionIndex] = useState(0);
  
  

  const [messages, setMessages] = useState([]);
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [isTransitioningAuth, setIsTransitioningAuth] = useState(false); 

  const [showAfkModal, setShowAfkModal] = useState(false);
  const [afkCountdown, setAfkCountdown] = useState(30);
  const timerInactiviteRef = useRef(null);
  const timerDecompteRef = useRef(null);
  const modalOuverteRef = useRef(false);
const [demandesEnAttente, setDemandesEnAttente] = useState(0);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [blockedBy, setBlockedBy] = useState([]);

  const chargerBlocages = async () => {
    if (!session?.user?.id) return;
    const { data } = await supabase
      .from('blocked_users')
      .select('blocker_id, blocked_id')
      .or(`blocker_id.eq.${session.user.id},blocked_id.eq.${session.user.id}`);

    setBlockedUsers(data?.filter(b => b.blocker_id === session.user.id).map(b => b.blocked_id) || []);
    setBlockedBy(data?.filter(b => b.blocked_id === session.user.id).map(b => b.blocker_id) || []);
  };

  useEffect(() => {
    modalOuverteRef.current = showAfkModal;
  }, [showAfkModal]);

  useEffect(() => {
    if (!session) return;

    const INACTIVITE_MAX = 15 * 60 * 1000;

    const reinitialiserChrono = () => {
      if (modalOuverteRef.current) return; 

      clearTimeout(timerInactiviteRef.current);
      timerInactiviteRef.current = setTimeout(() => {
        setShowAfkModal(true);
        setAfkCountdown(30);
      }, INACTIVITE_MAX);
    };

    window.addEventListener('mousemove', reinitialiserChrono);
    window.addEventListener('keydown', reinitialiserChrono);
    window.addEventListener('click', reinitialiserChrono);

    reinitialiserChrono();
    return () => {
      window.removeEventListener('mousemove', reinitialiserChrono);
      window.removeEventListener('keydown', reinitialiserChrono);
      window.removeEventListener('click', reinitialiserChrono);
      clearTimeout(timerInactiviteRef.current);
    };
  }, [session]);

  useEffect(() => {
    if (showAfkModal) {
      timerDecompteRef.current = setInterval(() => {
        setAfkCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timerDecompteRef.current);
            supabase.auth.signOut().then(() => {
              window.location.reload();
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerDecompteRef.current);
    }

    return () => clearInterval(timerDecompteRef.current);
  }, [showAfkModal]);

  useEffect(() => {
    if (!session) return;

    const EXPIRATION_DELAI = 7 * 24 * 60 * 60 * 1000;
    
    const dateDerniereVisite = localStorage.getItem('derniere_visite_app');
    const maintenant = Date.now();

    if (dateDerniereVisite && (maintenant - parseInt(dateDerniereVisite) > EXPIRATION_DELAI)) {
      supabase.auth.signOut().then(() => {
        localStorage.removeItem('derniere_visite_app');
        window.location.reload();
      });
    } else {
      localStorage.setItem('derniere_visite_app', maintenant.toString());
    }
  }, [session]);

  useEffect(() => {
    if (!session?.user?.id) return;

    chargerBlocages();

    const channel = supabase.channel('ecoute-blocages')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'blocked_users', filter: `blocked_id=eq.${session.user.id}` },
        () => chargerBlocages() 
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'blocked_users', filter: `blocker_id=eq.${session.user.id}` },
        () => chargerBlocages()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id]);

  const basculerVersFormulaire = (estLogin) => {
    setIsTransitioningAuth(true); 
    setTimeout(() => {
      setIsLogin(estLogin);
      setShowAuthForm(true);
      setIsTransitioningAuth(false);
    }, 200);
  };

  const basculerVersAccueil = () => {
    setIsTransitioningAuth(true);
    setTimeout(() => {
      setShowAuthForm(false);
      setIsTransitioningAuth(false);
    }, 200);
  };

  const [menuContextuel, setMenuContextuel] = useState(null);
  const [menuFermeture, setMenuFermeture] = useState(false);
  const menuFermetureTimeout = useRef(null);

  const [showAideFormat, setShowAideFormat] = useState(false);
  const [aideFormatFermeture, setAideFormatFermeture] = useState(false);

  const toggleAideFormat = () => {
    if (showAideFormat) {
      setAideFormatFermeture(true);
      setTimeout(() => { setShowAideFormat(false); setAideFormatFermeture(false); }, 150);
    } else {
      setShowAideFormat(true);
    }
  };

  useEffect(() => {
    if (!session) return;

    
  }, [session]);

  const [showWelcome, setShowWelcome] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [guideStep, setGuideStep] = useState(0);

  const enregistrerChoixGuide = () => {
    if (session?.user?.id) {
      localStorage.setItem(`guide_termine_${session.user.id}`, 'true');
    }
  };

  const terminerGuide = () => {
    setShowGuide(false);
    setGuideStep(0);
    enregistrerChoixGuide();
  };

  const refuserGuide = () => {
    setShowWelcome(false);
    enregistrerChoixGuide();
    ajouterToast("Le guide reste disponible dans les paramètres !", "info");
  };

  const accepterGuide = () => {
    setShowWelcome(false);
    setShowGuide(true);
    setGuideStep(0);
  };

  useEffect(() => {
    if (session?.user?.id) {
      const guideDejaVu = localStorage.getItem(`guide_termine_${session.user.id}`);
      if (!guideDejaVu) {
        const timer = setTimeout(() => setShowWelcome(true), 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [session?.user?.id]);

  useEffect(() => {
    const handleStartGuide = () => {
      setVueActive('chat');
      setShowWelcome(false);
      setShowGuide(true);
      setGuideStep(0);
    };

    window.addEventListener('start-app-guide', handleStartGuide);
    return () => window.removeEventListener('start-app-guide', handleStartGuide);
  }, []);

  const [salonActuel, setSalonActuel] = useState(() => localStorage.getItem('chat_salon_actuel') || '');
  const salonActuelRef = useRef(salonActuel);
  useEffect(() => { salonActuelRef.current = salonActuel; }, [salonActuel]);
  const [vueActive, setVueActive] = useState(() => localStorage.getItem('chat_vue_active') || 'chat');
  useEffect(() => {
    localStorage.setItem('chat_vue_active', vueActive);
    if (vueActive === 'explorer' && publicServers.length === 0) {
      chargerPublicServers();
    }
  }, [vueActive]);
  const [servers, setServers] = useState([]);
  const [serverActuel, setServerActuel] = useState(null);
  const [serverChannel, setServerChannel] = useState(null);
  const [serverPrecedent, setServerPrecedent] = useState(null);

  

  const activeRoomRef = useRef('');
  useEffect(() => {
    if (serverActuel && serverChannel) {
      activeRoomRef.current = `server-${serverActuel.id}-${serverChannel.id}`;
    } else if (!serverActuel && vueActive === 'chat') {
      activeRoomRef.current = salonActuel;
    } else {
      activeRoomRef.current = '';
    }
  }, [serverActuel, serverChannel, salonActuel, vueActive]);
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('chat_notifs');
    return saved ? JSON.parse(saved) : {};
  });
  useEffect(() => { localStorage.setItem('chat_notifs', JSON.stringify(notifications)); }, [notifications]);

  const [salonsPrives, setSalonsPrives] = useState([]);
  const salonsPrivesRef = useRef(salonsPrives);
  useEffect(() => { salonsPrivesRef.current = salonsPrives; }, [salonsPrives]);

  const [profilPopover, setProfilPopover] = useState(null);

  useEffect(() => {
    setProfilPopover(null);
  }, [vueActive, serverActuel?.id, serverChannel?.id, salonActuel]);

  const [authLoaded, setAuthLoaded] = useState(false);
  const [serversLoaded, setServersLoaded] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [friendsLoaded, setFriendsLoaded] = useState(false);
  const [groups, setGroups] = useState([]);
  const [memberMeta, setMemberMeta] = useState({});
  const [metaLoaded, setMetaLoaded] = useState(false);
  const dataLoaded = serversLoaded && profileLoaded && friendsLoaded && metaLoaded;

  const [amis, setAmis] = useState([]);
  const [demandesAmis, setDemandesAmis] = useState([]);
  const [ongletAmis, setOngletAmis] = useState('tous');
  const [rechercheAmi, setRechercheAmi] = useState('');
  const [ajoutAmiLoading, setAjoutAmiLoading] = useState(false);  const [utilisateursEnLigne, setUtilisateursEnLigne] = useState([]);
  const [messageEnEdition, setMessageEnEdition] = useState(null);
  const [texteEdition, setTexteEdition] = useState("");
  const [reponseA, setReponseA] = useState(null); 
  const [afficherNotif, setAfficherNotif] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const fichierInputRef = useRef(null);
  const [fichierPreview, setFichierPreview] = useState(null);

  const [publicServers, setPublicServers] = useState([]);
  const [rechercheExplorer, setRechercheExplorer] = useState('');
  const [explorerLoading, setExplorerLoading] = useState(false);


  const chargerPublicServers = async () => {
    setExplorerLoading(true);
  
    const { data: serversData, error: serversError } = await supabase
      .from('servers')
      .select('*, server_members(count)')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(100);

    if (serversError) {
      ajouterToast("Erreur de chargement des serveurs", "error");
      setExplorerLoading(false);
      return;
    }

    if (!serversData || serversData.length === 0) {
      setPublicServers([]);
      setExplorerLoading(false);
      return;
    }

    const ownerIds = [...new Set(serversData.map(s => s.owner_id).filter(Boolean))];
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, pseudo')
      .in('id', ownerIds);

    const serveursComplets = serversData.map(srv => {
      const createur = profilesData?.find(p => p.id === srv.owner_id);
      return {
        ...srv,
        profiles: createur ? { pseudo: createur.pseudo } : null
      };
    });

    setPublicServers(serveursComplets);
    setExplorerLoading(false);
  };

  const rejoindreServeurPublic = async (srv) => {
    const { data: isBanned } = await supabase.from('server_bans')
      .select('server_id')
      .eq('server_id', srv.id)
      .eq('user_id', session.user.id)
      .maybeSingle();

    if (isBanned) {
      ajouterToast("Vous êtes banni de ce serveur.", "error");
      return;
    }
    const _pseudoTech = session?.user?.email?.split('@')[0];
    const monPseudoAffiche = monProfil?.pseudo || _pseudoTech;
    
    const { error } = await supabase.from('server_members').insert({
      server_id: srv.id,
      user_id: session.user.id,
      pseudo: monPseudoAffiche,
      role: srv.owner_id === session.user.id ? 'owner' : 'member'
    });

    if (error && error.code !== '23505') {
      ajouterToast("Erreur : " + error.message, "error");
    } else {
      ajouterToast(`Bienvenue sur ${srv.name} !`);
      const { data: memberRows } = await supabase.from('server_members').select('server_id').eq('user_id', session.user.id);
      if (memberRows) {
        const ids = memberRows.map(r => r.server_id);
        const { data: serverData } = await supabase.from('servers').select('*').in('id', ids);
        setServers(serverData || []);
      }
      const { data: firstCh } = await supabase.from('server_channels').select('*').eq('server_id', srv.id).order('position').limit(1).single();
      setServerActuel(srv);
      setServerChannel(firstCh);
      setVueActive('chat');
    }
  };

  const getFileIcon = (fileType) => {
    if (!fileType) return File;
    if (fileType.startsWith('video/')) return FileVideo;
    if (fileType.startsWith('audio/')) return Music;
    if (fileType === 'application/pdf' || fileType.includes('word') || fileType.includes('document')) return FileText;
    return File;
  };

  const getFileColor = (fileType) => {
    if (!fileType) return 'text-gray-400';
    if (fileType.startsWith('video/')) return 'text-blue-400';
    if (fileType.startsWith('audio/')) return 'text-purple-400';
    if (fileType === 'application/pdf') return 'text-red-400';
    if (fileType.includes('word') || fileType.includes('document')) return 'text-blue-500';
    return 'text-gray-400';
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' o';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' Ko';
    return (bytes / (1024 * 1024)).toFixed(1) + ' Mo';
  };

  const GIPHY_KEY = import.meta.env.VITE_GIPHY_KEY || "";
  const [gifOuvert, setGifOuvert] = useState(false);
  const [emojiOuvert, setEmojiOuvert] = useState(false);
  const inputMessageRef = useRef(null);
  const emojiTriggerRef = useRef(null);
  const [gifQuery, setGifQuery] = useState('');
  const [gifResultats, setGifResultats] = useState([]);
  const [gifTendances, setGifTendances] = useState([]);
  const [gifChargement, setGifChargement] = useState(false);
  const [utilisateursEnTrain, setUtilisateursEnTrain] = useState([]);
  const canalTypingRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const conteneurMessagesRef = useRef(null);
  const estEnBasRef = useRef(true);
  const dernierTexteTypingRef = useRef(null);
  const [premierNonLuId, setPremierNonLuId] = useState(null);
  const ligneNonLuRef = useRef(null);
  const [tousCharges, setTousCharges] = useState(false);
  const [chargementAnciens, setChargementAnciens] = useState(false);
  const PAGE_SIZE = 50;
  const tousChargesRef = useRef(false);
  const chargementAnciensRef = useRef(false);
  const isPrependingRef = useRef(false);
  const messagesRef = useRef([]);
  const [rechercheOuverte, setRechercheOuverte] = useState(false);
  const [rechercheQuery, setRechercheQuery] = useState('');
  const [rechercheResultats, setRechercheResultats] = useState([]);
  const [rechercheEnCours, setRechercheEnCours] = useState(false);
  const rechercheRef = useRef(null);
  const messagesRefsMap = useRef({});
  const scrollPositionsSalons = useRef({});
  const emojisDispos = ["👍", "❤️", "😂", "🔥", "👀"];
  const finDesMessagesRef = useRef(null);
  const chargerMessagesAnciensRef = useRef(null);
  const estPremierChargementTermine = useRef(false);

  const [toasts, setToasts] = useState([]);
  const [estHorsLigne, setEstHorsLigne] = useState(!navigator.onLine);
  useEffect(() => {
    const online = () => setEstHorsLigne(false);
    const offline = () => setEstHorsLigne(true);
    window.addEventListener('online', online);
    window.addEventListener('offline', offline);
    return () => { window.removeEventListener('online', online); window.removeEventListener('offline', offline); };
  }, []);
  const [modalConfirm, setModalConfirm] = useState(null);

  const ajouterToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  };

  const { 
      commandeQuery, 
      commandeIndex, 
      setCommandeIndex, 
      traiterCommande, 
      gererFrappeCommande, 
      reinitialiserMenuCommande 
    } = useCommandes();

  const demanderConfirmation = (message, onConfirm, danger = true) => {
    setModalConfirm({ message, onConfirm, danger });
  };

  const forceScrollRef = useRef(false);

  const [monProfil, setMonProfil] = useState(null);
  const [ping, setPing] = useState(null);
  const monProfilRef = useRef(null);
  useEffect(() => { monProfilRef.current = monProfil; }, [monProfil]);
  const [profilsCache, setProfilsCache] = useState({});
  const [ongletParametres, setOngletParametres] = useState('profil'); 
  
  const [editPseudo, setEditPseudo] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editStatut, setEditStatut] = useState('en_ligne');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [uploadAvatarEnCours, setUploadAvatarEnCours] = useState(false);
  const [sauvegardeEnCours, setSauvegardeEnCours] = useState(false);
  const avatarInputRef = useRef(null);
  const inputRef = useRef(null);

  const LISTE_THEMES = ["dark", "light", "cupcake", "synthwave", "retro", "cyberpunk", "dracula", "night", "dim"];
  const [themeActuel, setThemeActuel] = useState(() => localStorage.getItem('chat_theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', themeActuel);
    localStorage.setItem('chat_theme', themeActuel);
  }, [themeActuel]);

  const STATUTS = {
    en_ligne:  { label: 'En ligne',  dot: 'bg-success',  text: 'text-success',  ring: 'ring-success'  },
    occupe:    { label: 'Occupé',    dot: 'bg-warning',  text: 'text-warning',  ring: 'ring-warning'  },
    absent:    { label: 'Absent',    dot: 'bg-error',    text: 'text-error',    ring: 'ring-error'    },
    invisible: { label: 'Invisible', dot: 'bg-gray-400', text: 'text-gray-400', ring: 'ring-gray-400' },
  };

  const estUtilisateurSupprime = (pseudo) => pseudo === '[supprimé]';

  const getStatutEffectif = (pseudoTech, profil) => {
  if (!profil || !utilisateursEnLigne.includes(pseudoTech)) return null;


  if (blockedUsers.includes(profil.id) || blockedBy.includes(profil.id)) {
    return null; 
  }

  if (profil.statut === 'invisible') return null; 

  return profil.statut || 'en_ligne';
};

  const StatutDot = ({ statut, taille = 'w-2.5 h-2.5' }) => {
    if (!statut) return null;
    return <span className={`${taille} rounded-full border-2 border-base-100 ${STATUTS[statut]?.dot || 'bg-gray-400'} flex-shrink-0`} />;
  };

  const fermerMenuContextuel = () => {
    setMenuFermeture(true);
    menuFermetureTimeout.current = setTimeout(() => { setMenuContextuel(null); setMenuFermeture(false); }, 150);
  };

  const ouvrirMenuContextuel = (e, message) => {
    e.preventDefault();
    if (menuFermetureTimeout.current) clearTimeout(menuFermetureTimeout.current);
    const decalageY = window.innerHeight - e.clientY < 220 ? e.clientY - 220 : e.clientY;
    const decalageX = window.innerWidth - e.clientX < 200 ? e.clientX - 200 : e.clientX;
    setMenuFermeture(false);
    setMenuContextuel({ message, x: decalageX, y: decalageY });
  };

  useEffect(() => {
    if (!menuContextuel) return;
    const handler = (e) => { if (e.button !== 2) fermerMenuContextuel(); };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, [menuContextuel]);

  useEffect(() => { tousChargesRef.current = tousCharges; }, [tousCharges]);
  useEffect(() => { chargementAnciensRef.current = chargementAnciens; }, [chargementAnciens]);
  useEffect(() => { messagesRef.current = messages; }, [messages]);



  const scrollerVersLeBas = () => {
    const faireScroll = () => {
      const c = conteneurMessagesRef.current;
      if (!c) return;
      c.scrollTop = c.scrollHeight;
      setAfficherNotif(false);
      estEnBasRef.current = true;
    };
    requestAnimationFrame(faireScroll);
    setTimeout(faireScroll, 150);
    setTimeout(faireScroll, 600);
  };

  const gererScroll = () => {
    if (!conteneurMessagesRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = conteneurMessagesRef.current;
    
    if (forceScrollRef.current) return;

    const estEnBas = scrollHeight - scrollTop - clientHeight < 100;
    estEnBasRef.current = estEnBas;
    if (estEnBas && afficherNotif) setAfficherNotif(false);
    
    if (scrollTop < 150 && scrollHeight > clientHeight) {
      chargerMessagesAnciens();
    }
  };
  

  const prevMessagesLengthRef = useRef(0);

  useEffect(() => {
    if (messages.length === 0) {
      prevMessagesLengthRef.current = 0;
      return;
    }

    const estNouveauMessage = messages.length > prevMessagesLengthRef.current;
    prevMessagesLengthRef.current = messages.length;

    if (!estNouveauMessage) return; 

    const dernierMessage = messages[messages.length - 1];
    const monPseudoTech = session?.user?.email?.split('@')[0];
    
    if (forceScrollRef.current) return;
    if (isPrependingRef.current) return;

    if (estEnBasRef.current || dernierMessage?.username === monPseudoTech) {
      const scroll = () => {
        const c = conteneurMessagesRef.current;
        if (c) { 
          c.scrollTop = c.scrollHeight; 
          estEnBasRef.current = true; 
          setAfficherNotif(false); 
        }
      };
      requestAnimationFrame(scroll);
      setTimeout(scroll, 150);
      setTimeout(scroll, 600);
    } else {
      setAfficherNotif(true);
    }
  }, [messages, session]);

  const formaterDateSeparateur = (dateISO) => {
    const d = new Date(dateISO), auj = new Date(), hier = new Date();
    hier.setDate(auj.getDate() - 1);
    if (d.toDateString() === auj.toDateString()) return "Aujourd'hui";
    if (d.toDateString() === hier.toDateString()) return "Hier";
    return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  const getNomSalonAffichage = () => {
    if (salonActuel.startsWith('dm_')) {
      const [, id1, id2] = salonActuel.split('_');
      const autreId = id1 === session.user.id ? id2 : id1;
      
      let profilAmi = profilsCache[autreId] || Object.values(profilsCache).find(p => p.pseudo === autreId);
      
      return `@ ${profilAmi?.pseudo || "Utilisateur"}`;
    }
    return `# ${salonActuel}`;
  };

  const changerSalon = (nouveauSalon) => {
    if (messages.length > 0)
      localStorage.setItem(`chat_dernier_lu_${salonActuel}`, messages[messages.length - 1].id.toString());
    
    setPremierNonLuId(null);
    setTousCharges(false);
    setGifOuvert(false);
    setEmojiOuvert(false);
    if (fichierPreview) { URL.revokeObjectURL(fichierPreview.url); setFichierPreview(null); }
    setSalonActuel(nouveauSalon);
    localStorage.setItem('chat_salon_actuel', nouveauSalon);
    setNotifications(prev => ({ ...prev, [nouveauSalon]: 0 }));
    setUtilisateursEnTrain([]);
    setVueActive('chat'); 
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadAvatarEnCours(true);
    const fileExt = file.name.split('.').pop();
    const filePath = `${session.user.id}/${Date.now()}.${fileExt}`; 
    
    const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
    if (uploadError) {
      ajouterToast("Erreur upload : " + uploadError.message, "error");
    } else {
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
      setEditAvatarUrl(publicUrl);
    }
    setUploadAvatarEnCours(false);
  };

  const sauvegarderParametres = async () => {
    if (!session) return;
    setSauvegardeEnCours(true);
    const pseudoTech = session.user.email.split('@')[0];
    const newPseudo = editPseudo.trim() || pseudoTech;
    
    const payload = {
      id: session.user.id,
      pseudo: newPseudo,
      bio: editBio,
      statut: editStatut,
      avatar_url: editAvatarUrl,
      updated_at: new Date().toISOString()
    };
    await supabase.from('profiles').upsert(payload);
    
    if (newPseudo !== monProfil?.pseudo) {
      await supabase.from('messages').update({ username: newPseudo }).eq('username', monProfil?.pseudo || pseudoTech);
      await supabase.from('reactions').update({ username: newPseudo }).eq('username', monProfil?.pseudo || pseudoTech);
    }

    const updated = { ...monProfil, ...payload };
    setMonProfil(updated);
    setProfilsCache(prev => ({ ...prev, [pseudoTech]: updated }));
    setSauvegardeEnCours(false);
    ajouterToast("Profil sauvegardé ✓");
  };

  const changerMotDePasse = async () => {
    if(editPassword.length < 6) return ajouterToast("6 caractères minimum requis.", 'error');
    setSauvegardeEnCours(true);
    const { error } = await supabase.auth.updateUser({ password: editPassword });
    setSauvegardeEnCours(false);
    if(error) ajouterToast("Erreur : " + error.message, 'error');
    else { ajouterToast("Mot de passe mis à jour ✓"); setEditPassword(""); }
  };

  const supprimerMonCompte = async () => {
    if (monProfil?.avatar_url) {
      const path = monProfil.avatar_url.split('/avatars/')[1];
      if (path) await supabase.storage.from('avatars').remove([path]);
    }
    const { error } = await supabase.rpc('delete_my_account');
    if (error) {
      ajouterToast("Erreur lors de la suppression : " + error.message, 'error');
      return;
    }
    ajouterToast("Compte supprimé définitivement.");
    setTimeout(async () => {
      await supabase.removeAllChannels();
      await supabase.auth.signOut();
      window.location.reload();
    }, 1200);
  };

  const ouvrirParametres = () => {
    const pseudoTech = session.user.email.split('@')[0];
    setEditPseudo(monProfil?.pseudo || pseudoTech);
    setEditBio(monProfil?.bio || '');
    setEditStatut(monProfil?.statut || 'en_ligne');
    setEditAvatarUrl(monProfil?.avatar_url || '');
    setOngletParametres('profil');
    setVueActive('parametres'); 
  };

  const supprimerSalonDM = async (contactId) => {
    const room = `dm_${[session.user.id, contactId].sort().join('_')}`;
    
    const nouveauxContacts = salonsPrives.filter(id => id !== contactId);
    setSalonsPrives(nouveauxContacts);
    
    await supabase.from('profiles').update({ dm_contacts: nouveauxContacts }).eq('id', session.user.id);
    
    if (salonActuel === room) changerSalon('');
  };

  const gererClicProfil = async (e, username, serverProps = null) => {
    const monPseudoAffiche = monProfil?.pseudo || session?.user?.email?.split('@')[0];
    const monPseudoTech = session?.user?.email?.split('@')[0];
    
    if (username === monPseudoAffiche || username === monPseudoTech) {
      return; 
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const targetProfil = Object.values(profilsCache).find(p => p.pseudo === username);
    if (!targetProfil) return;

    let left = Math.max(10, rect.left);
    if (left + 250 > window.innerWidth) left = window.innerWidth - 260;

    let positionStyle = {};
    
    if (rect.top > window.innerHeight / 2) {
      positionStyle = { 
        bottom: window.innerHeight - rect.top + 8, 
        left 
      };
    } else {
      positionStyle = { 
        top: rect.bottom + 8, 
        left 
      };
    }

    setProfilPopover({ 
      username: username, 
      displayUsername: username, 
      positionStyle,
      profil: targetProfil,
      serverProps
    });
  };

  const demarrerDM = async (identifiant) => {
    if (!identifiant) return;

    let autreUserId = identifiant;
    
    if (identifiant.length !== 36) {
      const profilTrouve = Object.values(profilsCache).find(p => p.pseudo === identifiant);
      if (profilTrouve) autreUserId = profilTrouve.id;
      else return; 
    }

    if (autreUserId === session.user.id) return;

    const room = `dm_${[session.user.id, autreUserId].sort().join('_')}`;

    if (!salonsPrives.includes(autreUserId)) {
      const nouveauxContacts = [...salonsPrives, autreUserId];
      setSalonsPrives(nouveauxContacts);
      await supabase.from('profiles').update({ dm_contacts: nouveauxContacts }).eq('id', session.user.id);
    }
    
    setServerActuel(null); 
    changerSalon(room); 
    
    setProfilPopover(null);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoaded(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      
      if (!s) {
        setShowAuthForm(false);
        setServers([]);
        setGroups([]);
        setMemberMeta({});
        setServerActuel(null);
        setServerChannel(null);
        setSalonsPrives([]);
        setMessages([]);
        setNotifications({});
        setUtilisateursEnLigne([]);
        setProfilsCache({});
        setMonProfil(null);
        setUtilisateursEnTrain([]);
        setSalonActuel('');

        localStorage.removeItem('chat_server_id');
        localStorage.removeItem('chat_channel_id');
        localStorage.removeItem('chat_salon_actuel');

        setServersLoaded(false);
        setProfileLoaded(false);
        setFriendsLoaded(false);
        setMetaLoaded(false);
        setAuthLoaded(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;
    const pseudoTech = session.user.email.split('@')[0];

    const preloadImage = (url) => {
      if (!url) return Promise.resolve();
      return new Promise((resolve) => {
        const img = new Image();
        img.src = url;
        img.onload = resolve;
        img.onerror = resolve;
      });
    };

    (async () => {
      const [resServers, resGroups, resMems] = await Promise.all([
        supabase.from('server_members').select('server_id').eq('user_id', session.user.id),
        supabase.from('server_groups').select('*').eq('user_id', session.user.id).order('position'),
        supabase.from('server_members').select('server_id, group_id, position').eq('user_id', session.user.id)
      ]);

      if (resServers.data?.length) {
        const ids = resServers.data.map(r => r.server_id);
        const { data: serverData } = await supabase.from('servers').select('*').in('id', ids);
        setServers(serverData || []);
        
        await Promise.all((serverData || []).map(s => preloadImage(s.icon_url)));

        const savedSrvId = localStorage.getItem('chat_server_id');
        const savedChId = localStorage.getItem('chat_channel_id');
        
        if (savedSrvId) {
          const srv = serverData.find(s => s.id === savedSrvId);
          if (srv) {
            setServerActuel(srv);
            if (savedChId) {
                      const { data: ch } = await supabase.from('server_channels').select('*').eq('id', savedChId).eq('server_id', srv.id).single();
                      if (ch) {
                        setServerChannel(ch);
                      } else {
                        localStorage.removeItem('chat_channel_id');
                      }
                    }
          }
        }
      }

      setGroups(resGroups.data || []);
      const meta = {};
      (resMems.data || []).forEach(m => { meta[m.server_id] = { group_id: m.group_id ?? null, position: m.position ?? 999 }; });
      setMemberMeta(meta);

      setServersLoaded(true);
      setMetaLoaded(true);
    })();

    (async () => {
      const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
      
      let monProfilActuel = data;

      if (data) {
        setMonProfil(data);
        setProfilsCache(prev => ({ ...prev, [data.id]: data }));
        await preloadImage(data.avatar_url);
      } else {
        const payload = { id: session.user.id, pseudo: pseudoTech, bio: '', statut: 'en_ligne' };
        const { data: newProfile } = await supabase.from('profiles').upsert(payload).select().single();
        if (newProfile) {
          monProfilActuel = newProfile;
          setMonProfil(newProfile);
          setProfilsCache(prev => ({ ...prev, [newProfile.id]: newProfile }));
        }
      }
      
      const { data: allProfiles } = await supabase.from('profiles').select('*');
      if (allProfiles) {
        const cacheMap = {};
        allProfiles.forEach(p => { cacheMap[p.id] = p; });
        setProfilsCache(cacheMap);
      }
      
      setProfileLoaded(true);
    })();
  }, [session]);

  useEffect(() => {
    if (!session) return;
    const monPseudoTech = session.user.email.split('@')[0];

    const chargerHistoriqueDMs = async () => {
      const { data: profil } = await supabase.from('profiles').select('dm_contacts').eq('id', session.user.id).single();
      if (profil && Array.isArray(profil.dm_contacts)) {
        
        const cleanContacts = profil.dm_contacts.filter(id => id && id.length === 36);
        setSalonsPrives(cleanContacts);
        
        if (cleanContacts.length !== profil.dm_contacts.length) {
          await supabase.from('profiles').update({ dm_contacts: cleanContacts }).eq('id', session.user.id);
        }

      } else {
        const { data } = await supabase.from('messages').select('room').ilike('room', 'dm_%');
        if (data) {
          const mesDMs = [...new Set(data.map(d => d.room).filter(r => r.split('_').includes(monPseudoTech)))];
          const contacts = [...new Set(mesDMs.map(room => {
            const [, u1, u2] = room.split('_');
            return u1 === monPseudoTech ? u2 : u1;
          }))];
          setSalonsPrives(contacts);
          if (contacts.length > 0) {
            await supabase.from('profiles').update({ dm_contacts: contacts }).eq('id', session.user.id);
          }
        }
      }
    };
    chargerHistoriqueDMs();

    const radarGlobal = supabase.channel('radar-global')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, ({ new: msg }) => {
        const monPseudoAffiche = monProfil?.pseudo || monPseudoTech;
        if (msg.username === monPseudoAffiche || msg.username === monPseudoTech) return;
        
        if (msg.room !== activeRoomRef.current) { 
          if (msg.room.startsWith('dm_')) {
            const parts = msg.room.split('_');
            if (parts.includes(session.user.id)) {
              const autreId = parts[1] === session.user.id ? parts[2] : parts[1];

              if (!salonsPrivesRef.current.includes(autreId)) {
                if (autreId.length === 36) { 
                  const nouveauxContacts = [...salonsPrivesRef.current, autreId];
                  setSalonsPrives(nouveauxContacts);
                  supabase.from('profiles').update({ dm_contacts: nouveauxContacts }).eq('id', session.user.id);
                }
              }
              setNotifications(prev => ({ ...prev, [msg.room]: (prev[msg.room] || 0) + 1 }));
            }
          } else {
            setNotifications(prev => ({ ...prev, [msg.room]: (prev[msg.room] || 0) + 1 }));
          }
        }
      }).subscribe();

    const canalPresence = supabase.channel('presence-globale', { config: { presence: { key: monPseudoTech } } });
    canalPresence
      .on('presence', { event: 'sync' }, () => {
        setUtilisateursEnLigne(Object.keys(canalPresence.presenceState()));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') await canalPresence.track({ online_at: new Date().toISOString() });
      });

    const canalBroadcast = supabase.channel('broadcast-typing-global');
    canalBroadcast
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        const { pseudo, salon, typing } = payload;
        const monPseudoAffiche = monProfilRef.current?.pseudo || monPseudoTech;
        if (!pseudo || pseudo === monPseudoAffiche || pseudo === monPseudoTech || salon !== salonActuelRef.current) return;
        clearTimeout(window[`typing_timeout_${pseudo}`]);
        if (typing) {
          setUtilisateursEnTrain(prev => prev.includes(pseudo) ? prev : [...prev, pseudo]);
          window[`typing_timeout_${pseudo}`] = setTimeout(() => {
            setUtilisateursEnTrain(prev => prev.filter(p => p !== pseudo));
          }, 3000);
        } else {
          setUtilisateursEnTrain(prev => prev.filter(p => p !== pseudo));
        }
      })
      .subscribe((status) => { if (status === 'SUBSCRIBED') canalTypingRef.current = canalBroadcast; });

    const canalServers = supabase.channel('realtime-servers')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'server_members', filter: `user_id=eq.${session.user.id}` }, async ({ new: row }) => {
        const { data } = await supabase.from('servers').select('*').eq('id', row.server_id).single();
        if (data) setServers(prev => prev.find(s => s.id === data.id) ? prev : [...prev, data]);
      })
      
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'server_members', filter: `user_id=eq.${session.user.id}` }, ({ old: row }) => {
        setServers(prev => prev.filter(s => s.id !== row.server_id));
        setServerActuel(prev => {
          if (prev?.id === row.server_id) {
            setVueActive('chat');
            localStorage.removeItem('chat_server_id');
            localStorage.removeItem('chat_channel_id');
            ajouterToast("Vous avez été retiré du serveur.", "error");
            return null;
          }
          return prev;
        });
      })

      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'server_bans', filter: `user_id=eq.${session.user.id}` }, ({ new: ban }) => {
        setServers(prev => prev.filter(s => s.id !== ban.server_id));
        setServerActuel(prev => {
          if (prev?.id === ban.server_id) {
            setVueActive('chat');
            localStorage.removeItem('chat_server_id');
            localStorage.removeItem('chat_channel_id');
            ajouterToast("Vous avez été banni de ce serveur.", "error");
            return null;
          }
          return prev;
        });
      })

      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'servers' }, ({ new: srv }) => {
        setServers(prev => prev.map(s => s.id === srv.id ? { ...s, ...srv } : s));
        setServerActuel(prev => prev?.id === srv.id ? { ...prev, ...srv } : prev);
        setPublicServers(prev => prev.map(s => s.id === srv.id ? { ...s, ...srv } : s));
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'servers' }, ({ old: srv }) => {
        setServers(prev => prev.filter(s => s.id !== srv.id));
        setServerActuel(prev => prev?.id === srv.id ? null : prev);
      })
      .subscribe();

    const canalProfils = supabase.channel('realtime-profiles')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'profiles' }, ({ new: profil }) => {
        setProfilsCache(prev => ({ ...prev, [profil.id]: profil }));
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, ({ new: profil }) => {
        setProfilsCache(prev => ({ ...prev, [profil.id]: profil }));
        if (profil.id === session.user.id) setMonProfil(profil);
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'profiles' }, ({ old: profil }) => {
        setProfilsCache(prev => { const next = { ...prev }; delete next[profil.id]; return next; });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(radarGlobal);
      supabase.removeChannel(canalPresence);
      supabase.removeChannel(canalBroadcast);
      supabase.removeChannel(canalProfils);
      supabase.removeChannel(canalServers);
      canalTypingRef.current = null;
    };
  }, [session]);


  useLayoutEffect(() => {
    if (forceScrollRef.current && conteneurMessagesRef.current && estPremierChargementTermine.current) {
      requestAnimationFrame(() => {
        if (!conteneurMessagesRef.current) return;
        if (premierNonLuId && ligneNonLuRef.current) {
          ligneNonLuRef.current.scrollIntoView({ behavior: 'auto', block: 'center' });
        } else {
          conteneurMessagesRef.current.scrollTop = conteneurMessagesRef.current.scrollHeight;
          estEnBasRef.current = true;
        }
        forceScrollRef.current = false;
      });
    }
  }, [messages, premierNonLuId]);

  useLayoutEffect(() => {
    if (!serverActuel && vueActive === 'chat' && conteneurMessagesRef.current) {
      const executerScrollBase = () => {
        if (conteneurMessagesRef.current) {
          conteneurMessagesRef.current.scrollTop = conteneurMessagesRef.current.scrollHeight;
        }
      };
      
      executerScrollBase();
      setTimeout(executerScrollBase, 150);
    }
  }, [serverActuel, vueActive]);

  useEffect(() => {
    if (!session) return;
    const chargerMessages = async () => {
      estPremierChargementTermine.current = false;
      
      const { data, error } = await supabase.from('messages')
        .select('*, reactions(*)')
        .eq('room', salonActuel)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE);
      
      if (!error && data) {
        const chrono = data.reverse();
        setTousCharges(data.length < PAGE_SIZE);
        const dernierId = localStorage.getItem(`chat_dernier_lu_${salonActuel}`);
        let nonLuId = null;
        if (dernierId) {
          const idx = chrono.findIndex(m => m.id.toString() === dernierId);
          if (idx !== -1 && idx < chrono.length - 1) nonLuId = chrono[idx + 1].id;
        }
        
        setPremierNonLuId(nonLuId);
        setMessages(chrono);

        setTimeout(() => {
          forceScrollRef.current = true;
          estPremierChargementTermine.current = true;

          if (conteneurMessagesRef.current) {
            conteneurMessagesRef.current.scrollTop = conteneurMessagesRef.current.scrollHeight;
            estEnBasRef.current = true;
          }
        }, 50);
      }
    };

    const chargerMessagesAnciens = async () => {
      if (tousChargesRef.current || chargementAnciensRef.current || messagesRef.current.length === 0) return;
      chargementAnciensRef.current = true;
      setChargementAnciens(true);
      const salon = salonActuelRef.current;
      const plusAncienDate = messagesRef.current[0].created_at;
      const { data, error } = await supabase.from('messages')
        .select('*, reactions(*)')
        .eq('room', salon)
        .lt('created_at', plusAncienDate)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE);
      if (!error && data && data.length > 0) {
        const anciens = data.reverse();
        const estTous = data.length < PAGE_SIZE;
        tousChargesRef.current = estTous;
        setTousCharges(estTous);
        const c = conteneurMessagesRef.current;
        const scrollAvant = c ? c.scrollHeight - c.scrollTop : 0;
        isPrependingRef.current = true;
        setMessages(prev => [...anciens, ...prev]);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (c) c.scrollTop = c.scrollHeight - scrollAvant;
            isPrependingRef.current = false;
            chargementAnciensRef.current = false;
            setChargementAnciens(false);
          });
        });
      } else {
        tousChargesRef.current = true;
        setTousCharges(true);
        chargementAnciensRef.current = false;
        setChargementAnciens(false);
      }
    };

    chargerMessagesAnciensRef.current = chargerMessagesAnciens;
    chargerMessages();

    const canalMessages = supabase.channel(`db-${salonActuel}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `room=eq.${salonActuel}` }, ({ eventType, new: n, old: o }) => {
        if (eventType === 'INSERT') setMessages(prev => [...prev, { ...n, reactions: [] }]);
        else if (eventType === 'DELETE') setMessages(prev => prev.filter(m => m.id !== o.id));
        else if (eventType === 'UPDATE') setMessages(prev => prev.map(m => m.id === n.id ? { ...m, ...n } : m));
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reactions' }, ({ new: r }) => {
        setMessages(prev => prev.map(m => {
          if (m.id !== r.message_id) return m;
          const dejaPresent = m.reactions?.find(rx => rx.username === r.username && rx.emoji === r.emoji);
          if (dejaPresent) {
            return { ...m, reactions: m.reactions.map(rx => rx === dejaPresent ? r : rx) };
          }
          return { ...m, reactions: [...(m.reactions || []), r] };
        }));
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'reactions' }, ({ old: r }) => {
        setMessages(prev => prev.map(m => ({ ...m, reactions: (m.reactions || []).filter(rx => rx.id !== r.id) })));
      })
      .subscribe();

    return () => { supabase.removeChannel(canalMessages); setAfficherNotif(false); };
  }, [session, salonActuel]);

  const chargerMessagesAnciens = () => chargerMessagesAnciensRef.current?.();

  const sInscrire = async (e, captchaToken) => { 
    e.preventDefault();
    setAuthError("");
    
    if (!email || !password) return setAuthError("Veuillez remplir tous les champs.");
    if (password.length < 6) return setAuthError("Le mot de passe doit faire 6 car. min.");
    
    if (!captchaToken) return setAuthError("Veuillez valider que vous n'êtes pas un robot.");

    const { data: banned } = await supabase
      .from('banned_emails')
      .select('email')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (banned) return setAuthError("Cette adresse email est bannie définitivement.");

    const { error } = await supabase.auth.signUp({ 
      email: email.toLowerCase().trim(), 
      password,
      options: {
        captchaToken: captchaToken 
      }
    });

    if (error) {
      if (error.message.includes('bannie')) setAuthError("Cette adresse email est bannie définitivement.");
      else setAuthError(error.message);
    }
    else {
      setVueActive('chat'); 
      localStorage.setItem('chat_vue_active', 'chat'); 
    }
  };
const seConnecter = async (e, captchaToken) => { 
    e.preventDefault(); 
    setAuthError(""); 
    
    if (!email || !password) return setAuthError("Veuillez remplir tous les champs."); 
    if (!captchaToken) return setAuthError("Veuillez valider le Captcha.");

    const { error } = await supabase.auth.signInWithPassword({ 
      email: email.toLowerCase().trim(), 
      password,
      options: { captchaToken: captchaToken }
    }); 
    
    if (error) { 
      if (error.message.includes("Invalid login")) setAuthError("Email/Mot de passe incorrect."); 
      else setAuthError(error.message); 
    } else { 
      setVueActive('chat'); 
      localStorage.setItem('chat_vue_active', 'chat');
    }
  };
    const seDeconnecter = async () => { 
    await supabase.removeAllChannels(); 
    setUtilisateursEnLigne([]); 
    setSalonsPrives([]); 
    setNotifications({}); 
    
    await supabase.auth.signOut(); 
    window.location.reload(); 
  };
    const toggleMode = () => { setIsLogin(!isLogin); setAuthError(""); setPassword(""); };

  const lancerRecherche = async (query) => {
    if (!query.trim()) { setRechercheResultats([]); return; }
    setRechercheEnCours(true);
    const { data } = await supabase.from('messages').select('id, content, username, room, created_at').ilike('content', `%${query}%`).order('created_at', { ascending: false }).limit(50);
    setRechercheResultats(data || []);
    setRechercheEnCours(false);
  };

  const allerAuMessage = (msgId, room) => {
    if (room !== salonActuel) { changerSalon(room); return; }
    const el = messagesRefsMap.current[msgId];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-2', 'ring-primary', 'rounded-xl');
      setTimeout(() => el.classList.remove('ring-2', 'ring-primary', 'rounded-xl'), 2000);
    }
    setRechercheOuverte(false);
  };

  const surlignerTexte = (texte, query) => {
    if (!query.trim() || !texte) return texte;
    const idx = texte.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return texte;
    return [texte.slice(0, idx), <mark key="m" className="bg-primary/30 text-base-content rounded px-0.5 font-bold">{texte.slice(idx, idx + query.length)}</mark>, texte.slice(idx + query.length)];
  };

  const ouvrirGif = async () => {
    setGifOuvert(v => !v);
    if (gifTendances.length === 0 && GIPHY_KEY) {
      setGifChargement(true);
      try {
        const res = await fetch(`https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_KEY}&limit=24&rating=g`);
        const json = await res.json();
        setGifTendances(json.data || []);
      } catch (err) {
        console.error("Erreur Giphy Tendances:", err);
      } finally {
        setGifChargement(false);
      }
    }
  };

  const rechercherGifs = async (query) => {
    setGifQuery(query);
    if (!query.trim()) { setGifResultats([]); return; }
    if (!GIPHY_KEY) return;

    setGifChargement(true);
    try {
      const res = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_KEY}&q=${encodeURIComponent(query)}&limit=24&rating=g`);
      const json = await res.json();
      setGifResultats(json.data || []);
    } catch (err) {
      console.error("Erreur Giphy Recherche:", err);
    } finally {
      setGifChargement(false);
    }
  };

  const envoyerGif = async (gif) => {
    const url = gif.images.original.url;
    const pseudo = session.user.email.split('@')[0];
    const pseudoAffiche = monProfil?.pseudo || pseudo;
    setGifOuvert(false);
    const { error } = await supabase.from('messages').insert([{
      content: '',
      username: pseudoAffiche,
      room: salonActuel,
      image_url: url,
    }]);
    scrollerVersLeBas();
    if (error) {
      ajouterToast("Impossible d'envoyer le GIF", "error");
    }
  };

  const insererEmoji = (emoji) => {
    setNouveauMessage(prev => prev + emoji);
    setTimeout(() => {
      const input = inputMessageRef.current;
      if (input) {
        input.focus();
        const len = input.value.length;
        input.setSelectionRange(len, len);
      }
    }, 0);
  };

  const gererFrappe = (e) => {
    const val = e.target.value;
    setNouveauMessage(val);

    if (!session) return;
    const pseudoAffiche = monProfil?.pseudo || session.user.email.split('@')[0];
    
    if (!typingTimeoutRef.current) {
      canalTypingRef.current?.send({
        type: 'broadcast',
        event: 'typing',
        payload: { pseudo: pseudoAffiche, salon: salonActuelRef.current, typing: true }
      });
    }
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      canalTypingRef.current?.send({
        type: 'broadcast',
        event: 'typing',
        payload: { pseudo: pseudoAffiche, salon: salonActuelRef.current, typing: false }
      });
      typingTimeoutRef.current = null;
    }, 2000);

    const cursorPosition = e.target.selectionStart;
    const textBeforeCursor = val.slice(0, cursorPosition);
    const words = textBeforeCursor.split(/\s/);
    const lastWord = words[words.length - 1];

    gererFrappeCommande(val);

    if (lastWord.startsWith('@')) {
      const search = lastWord.slice(1).toLowerCase();
      setMentionQuery(search);
      setMentionIndex(0);
    } else {
      setMentionQuery(null);
    }
  }

  const dernierEnvoiRef = useRef(0);
  const envoyerMessage = async () => {
    const messageATraiter = nouveauMessage.trim();
    if (!messageATraiter) return;

    let texteFinal = traiterCommande(messageATraiter, ajouterToast);
    if (texteFinal === null) return;

    const pseudosAmis = amis.map(f => {
      const idAmi = f.requester_id === session.user.id ? f.receiver_id : f.requester_id;
      return Object.values(profilsCache).find(p => p.id === idAmi)?.pseudo;
    }).filter(Boolean);

    const regexMention = /@(\w+)/g;
    const motsApresArobase = [...texteFinal.matchAll(regexMention)].map(m => m[1]);

    const mentionsValides = motsApresArobase.filter(pseudo => pseudosAmis.includes(pseudo));

    const pseudoAffiche = monProfil?.pseudo || session.user.email.split('@')[0];
    const reponse = reponseA ? reponseA.id : null;
    
    setNouveauMessage(""); 
    setReponseA(null);
    setMentionQuery(null);
    reinitialiserMenuCommande();
    clearTimeout(typingTimeoutRef.current);
    canalTypingRef.current?.send({ type: 'broadcast', event: 'typing', payload: { pseudo: pseudoAffiche, salon: salonActuelRef.current, typing: false } });
    scrollerVersLeBas();
    
    const { error } = await supabase.from('messages').insert([{ 
      content: texteFinal, 
      username: pseudoAffiche, 
      room: salonActuel, 
      reply_to_id: reponse,
      mentions: mentionsValides,
    }]);

    if (error) {
      ajouterToast("Impossible d'envoyer : blocage actif.", "error");
      setNouveauMessage(messageATraiter); 
    }
  };

  
  const envoyerImage = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setIsUploading(true);
    const pseudoAffiche = monProfil?.pseudo || session.user.email.split('@')[0];
    const ext = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;
    const salonPropre = salonActuel.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9_-]/g, "").toLowerCase();
    const { error: uploadError } = await supabase.storage.from('chat-images').upload(`${salonPropre}/${fileName}`, file);
    if (uploadError) { ajouterToast("Erreur upload : " + uploadError.message, "error"); setIsUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from('chat-images').getPublicUrl(`${salonPropre}/${fileName}`);
    await supabase.from('messages').insert([{ content: "", username: pseudoAffiche, room: salonActuel, image_url: publicUrl }]);
    setIsUploading(false); scrollerVersLeBas();
  };

  const confirmerEnvoiFichier = async () => {
    if (!fichierPreview) return;
    setIsUploading(true);
    const { file, type } = fichierPreview;
    
    const pseudoAffiche = monProfil?.pseudo || session.user.email.split('@')[0];
    const ext = file.name.split('.').pop().toLowerCase();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;
    const salonPropre = salonActuel.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9_-]/g, "").toLowerCase();

    const bucket = type.startsWith('image/') ? 'chat-images' : 'chat-files';
    const { error } = await supabase.storage.from(bucket).upload(`${salonPropre}/${fileName}`, file);
    if (error) {
      ajouterToast('Erreur upload : ' + error.message, 'error');
      setIsUploading(false);
      return;
    }
    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(`${salonPropre}/${fileName}`);
    const { error: insertError } = await supabase.from('messages').insert([{
      content: '',
      username: pseudoAffiche,
      room: salonActuel,
      image_url: publicUrl,
      file_name: file.name,
      file_type: type,
    }]);
    if (insertError) ajouterToast('Erreur envoi : ' + insertError.message, 'error');
    if (fichierPreview.url) {
      URL.revokeObjectURL(fichierPreview.url);
    }
    setIsUploading(false);
    setFichierPreview(null);
    scrollerVersLeBas();
  };

  const envoyerFichier = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    event.target.value = '';

    const MAX = 50 * 1024 * 1024;
    if (file.size > MAX) { ajouterToast('Fichier trop lourd (max 50 Mo)', 'error'); return; }

    const url = URL.createObjectURL(file);
    setFichierPreview({ file, url, type: file.type });
  };

  const supprimerMessage = async (id) => {
    const el = messagesRefsMap.current[id];
    if (el) {
      el.style.transition = 'opacity 0.35s ease, transform 0.35s ease';
      el.style.opacity = '0';
      el.style.transform = 'scale(0.97)';
    }
    setTimeout(async () => {
      const { error } = await supabase.from('messages').delete().eq('id', id);
      if (error) {
        if (el) { el.style.opacity = '1'; el.style.transform = 'scale(1)'; }
        ajouterToast("Erreur lors de la suppression.", 'error');
      }
    }, 300);
  };
  const sauvegarderModification = async (id) => { 
    if (!texteEdition.trim()) return; 
    const { error } = await supabase
      .from('messages')
      .update({ 
        content: texteEdition,
        updated_at: new Date().toISOString() 
      })
      .eq('id', id); 
      
    if (!error) { 
      setMessageEnEdition(null); 
      setTexteEdition(""); 
    } else {
      ajouterToast(`Erreur modification : ${error.message}`, "error");
    }
  };

 const toggleReaction = async (messageId, emoji) => {
    const message = messages.find(m => m.id === messageId);
    if (!message) return;

    const pseudoAffiche = monProfil?.pseudo || session.user.email.split("@")[0];
    const existing = message.reactions?.find(r => r.username === pseudoAffiche && r.emoji === emoji);
    
    if (existing) {
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, reactions: m.reactions.filter(r => r.id !== existing.id) } : m));
      await supabase.from("reactions").delete().eq("id", existing.id);
    } else {
      const fakeReaction = { id: Date.now(), message_id: messageId, username: pseudoAffiche, emoji };
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, reactions: [...(m.reactions || []), fakeReaction] } : m));
      await supabase.from("reactions").insert([{ message_id: messageId, username: pseudoAffiche, emoji }]);
    }
  };

  const getAvatarUrlForDisplay = (usernameOrId) => {
    if (!usernameOrId || usernameOrId === '[supprimé]') 
      return `https://ui-avatars.com/api/?name=?&background=6b7280&color=fff&rounded=true&size=32&bold=true`;
    
    let p = profilsCache[usernameOrId] || Object.values(profilsCache).find(profil => profil.pseudo === usernameOrId);
    
    if (p && p.avatar_url) return p.avatar_url;
    
    const displayStr = p?.pseudo || usernameOrId;
    const initials = displayStr.split('.').map(part => part[0].toUpperCase()).join('');
    return `https://ui-avatars.com/api/?name=${initials}&background=random&rounded=true&size=32&bold=true`;
  };

  const chargerAmis = async () => {
    if (!session?.user) return;
    const { data, error } = await supabase.from('friendships').select('*')
      .or(`requester_id.eq.${session.user.id},receiver_id.eq.${session.user.id}`);
    
    if (data) {
      const amiIds = data.map(f => f.requester_id === session.user.id ? f.receiver_id : f.requester_id);
      if (amiIds.length > 0) {
        const { data: profilsAmis } = await supabase.from('profiles').select('*').in('id', amiIds);
        if (profilsAmis) {
          setProfilsCache(prev => {
            const maj = { ...prev };
            profilsAmis.forEach(p => maj[p.id] = p);
            return maj;
          });
        }
      }
      setAmis(data.filter(f => f.status === 'accepted'));
      
      const enAttente = data.filter(f => f.status === 'pending' && f.receiver_id === session.user.id);
      
      setDemandesAmis(enAttente);
      setDemandesEnAttente(enAttente.length);
    }
    setFriendsLoaded(true);
  };

  useEffect(() => {
    if (!session) return;
    chargerAmis();

    const canalAmis = supabase.channel('realtime-friendships')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friendships' }, () => {
        chargerAmis();
      })
      .subscribe();

    return () => supabase.removeChannel(canalAmis);
  }, [session]);

  useEffect(() => {
    const handleContextMenu = (e) => {
      const targetTag = e.target.tagName.toLowerCase();
      
      if (targetTag === 'input' || targetTag === 'textarea') {
        return; 
      }
      
      e.preventDefault();
    };

    document.addEventListener('contextmenu', handleContextMenu);
    
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  const getProfilAmi = (f) => {
    const amiId = f.requester_id === session?.user?.id ? f.receiver_id : f.requester_id;
    return Object.values(profilsCache).find(p => p.id === amiId) || { id: amiId, pseudo: 'Utilisateur inconnu' };
  };

  const envoyerDemandeAmi = async (e) => {
    e.preventDefault();
    if (!rechercheAmi.trim()) return;
    setAjoutAmiLoading(true);
    const { data: target } = await supabase.from('profiles').select('*').ilike('pseudo', rechercheAmi.trim()).single();
    if (!target) { ajouterToast("Utilisateur introuvable", "error"); setAjoutAmiLoading(false); return; }
    if (target.id === session.user.id) { ajouterToast("C'est vous !", "error"); setAjoutAmiLoading(false); return; }

    setProfilsCache(prev => ({ ...prev, [target.id]: target }));

    const exist = [...amis, ...demandesAmis].find(f => f.requester_id === target.id || f.receiver_id === target.id);
    if (exist) { ajouterToast("Demande déjà existante ou déjà amis.", "error"); setAjoutAmiLoading(false); return; }

    const { error } = await supabase.from('friendships').insert({ requester_id: session.user.id, receiver_id: target.id, status: 'pending' });
    if (error) ajouterToast("Erreur: " + error.message, "error");
    else { ajouterToast("Demande envoyée à " + target.pseudo); setRechercheAmi(''); }
    setAjoutAmiLoading(false);
  };

  const repondreDemandeAmi = async (id, accepter) => {
    setDemandesAmis(prev => prev.filter(f => f.id !== id));
    
    if (accepter) {
      await supabase.from('friendships').update({ status: 'accepted' }).eq('id', id);
      ajouterToast("Nouvel ami ajouté !");
    } else {
      await supabase.from('friendships').delete().eq('id', id);
    }
  };

  const supprimerAmi = async (amitieId) => {
    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', amitieId);

    if (error) {
      ajouterToast("Erreur lors de la suppression : " + error.message, "error");
    } else {
      ajouterToast("Ami retiré", "success");
    }
  };

  useEffect(() => {
    if (!session) return;
    let isMounted = true;

    const mesurerPing = async () => {
      const debut = Date.now();
      await supabase.from('profiles').select('id').limit(1);
      const latence = Date.now() - debut;
      if (isMounted) setPing(latence);
    };

    mesurerPing(); 
    const interval = setInterval(mesurerPing, 2000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [session]);

  if (!authLoaded || (session && !dataLoaded)) {
    return (
      <div className="flex h-screen w-full bg-base-300 items-center justify-center flex-col gap-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]"></div>
        
        <div className="relative z-10 flex flex-col items-center">
          
          <div className="relative flex items-center justify-center mb-4">
            <div className="w-3 h-3 bg-primary rounded-full animate-ping absolute"></div>
            <div className="w-3 h-3 bg-primary rounded-full absolute"></div>
            
            <Atom size={72} className="text-primary opacity-80 animate-[spin_4s_linear_infinite]" strokeWidth={1} />
          </div>
          
          <span className="text-sm font-black text-base-content/60 uppercase tracking-[0.3em] mt-2 animate-pulse">
            Chargement...
          </span>
        </div>
      </div>
    );
  }
  
  if (!session) {
    return (
      <LandingPage 
        isTransitioningAuth={isTransitioningAuth}
        showAuthForm={showAuthForm}
        basculerVersAccueil={basculerVersAccueil}
        basculerVersFormulaire={basculerVersFormulaire}
        isLogin={isLogin}
        authError={authError}
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        seConnecter={seConnecter}
        sInscrire={sInscrire}
      />
    );
  }

  

  const monPseudoTech = session.user.email.split('@')[0];
  const monPseudoAffiche = monProfil?.pseudo || monPseudoTech;
  const totalNotifsDMs = Object.entries(notifications)
    .filter(([room]) => room.startsWith('dm_'))
    .reduce((acc, [, count]) => acc + count, 0);


  let targetId = null;
  if (salonActuel?.startsWith('dm_')) {
    const ids = salonActuel.replace('dm_', '').split('_');
    targetId = ids.find(id => id !== session.user.id);
  }

  const jeLaiBloque = targetId && blockedUsers.includes(targetId);
  const ilMaBloque = targetId && blockedBy.includes(targetId);

    

  return (
    <AppProvider 
      session={session} 
      monProfil={monProfil} 
      ajouterToast={ajouterToast}
      utilisateursEnLigne={utilisateursEnLigne}
      profilsCache={profilsCache}
      getStatutEffectif={getStatutEffectif}
      blockedUsers={blockedUsers}
        blockedBy={blockedBy}
        chargerBlocages={chargerBlocages}
    >
    <div className="flex h-screen bg-base-200 relative overflow-hidden">
      <MobileOverlay />

      <QuickSwitcher 
        servers={servers} 
        amis={amis} 
        onSelectServer={(srv) => {
          setServerActuel(srv);
          setVueActive('server');
          setSalonActuel(null);
        }}
        demarrerDM={(pseudo) => {
          demarrerDM(pseudo);
        }}
      />
      {estHorsLigne && (
        <div className="fixed top-0 left-0 right-0 z-[500] bg-error text-error-content text-center text-sm font-bold py-2 flex items-center justify-center gap-2">
          Connexion perdue — les messages ne seront pas envoyés
        </div>
      )}
        <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 items-end pointer-events-none">
          {toasts.map(t => (
            <div key={t.id} className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-sm font-medium border backdrop-blur-sm
              animate-[toastIn_0.25s_cubic-bezier(0.34,1.56,0.64,1)_forwards]
              ${t.type === 'error' ? 'bg-error/90 text-error-content border-error/30' : 'bg-base-100 text-base-content border-base-300'}`}>
              <span>{t.type === 'error' ? '✕' : '✓'}</span>
              <span>{t.message}</span>
            </div>
          ))}
        </div>

      {modalConfirm && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setModalConfirm(null)} />
          <div className="relative pointer-events-auto bg-base-100 rounded-2xl shadow-2xl border border-base-200 w-full max-w-xs mx-4 p-5 z-10 animate-[modalIn_0.18s_cubic-bezier(0.34,1.2,0.64,1)_forwards]">
            <p className="text-sm text-base-content/80 mb-4 leading-relaxed">{modalConfirm.message}</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setModalConfirm(null)} className="btn btn-ghost btn-sm">Annuler</button>
              <button onClick={() => { modalConfirm.onConfirm(); setModalConfirm(null); }}
                className={`btn btn-sm ${modalConfirm.danger ? 'btn-error' : 'btn-primary'}`}>
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes toastIn { from{opacity:0;transform:translateX(16px) scale(0.95)} to{opacity:1;transform:translateX(0) scale(1)} }
        @keyframes modalIn { from{opacity:0;transform:scale(0.95) translateY(8px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes menuAppear { from{opacity:0;transform:scale(0.92) translateY(-6px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes popoverAppear { from{opacity:0;transform:scale(0.94) translateY(-4px)} to{opacity:1;transform:scale(1) translateY(0)} }
        .popover-appear { animation: popoverAppear 0.15s cubic-bezier(0.34,1.4,0.64,1) forwards; }
        @keyframes menuDisappear { from{opacity:1;transform:scale(1) translateY(0)} to{opacity:0;transform:scale(0.92) translateY(-6px)} }
        .menu-contextuel-enter{animation:menuAppear 0.15s cubic-bezier(0.34,1.56,0.64,1) forwards;transform-origin:top left}
        .menu-contextuel-exit{animation:menuDisappear 0.12s ease-in forwards;transform-origin:top left}
        @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        .animate-fade-in{animation:fadeIn 0.2s ease forwards}
        @keyframes emojiPop{0%{opacity:0;transform:scale(0.5) translateY(4px)}70%{transform:scale(1.15) translateY(-2px)}100%{opacity:1;transform:scale(1) translateY(0)}}
        .emoji-btn{animation:emojiPop 0.2s ease forwards}
        @keyframes formatPopIn { 0% {opacity:0; transform:scale(0.9) translateY(4px)} 100% {opacity:1; transform:scale(1) translateY(0)} }
        @keyframes formatPopOut { 0% {opacity:1; transform:scale(1) translateY(0)} 100% {opacity:0; transform:scale(0.9) translateY(4px)} }
        .format-enter { animation: formatPopIn 0.15s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; transform-origin: bottom left; }
        .format-exit { animation: formatPopOut 0.15s ease-in forwards; transform-origin: bottom left; }
        @keyframes reactionAppear{0%{opacity:0;transform:scale(0.6)}60%{transform:scale(1.18)}100%{opacity:1;transform:scale(1)}}
        .reaction-badge{animation:reactionAppear 0.2s cubic-bezier(0.34,1.56,0.64,1) forwards;transform-origin:center}
        .reaction-tooltip{visibility:hidden;opacity:0;transform:translateY(4px) scale(0.96);transition:opacity 0.15s ease,transform 0.15s ease,visibility 0s linear 0.15s;pointer-events:none}
        .reaction-wrapper:hover .reaction-tooltip{visibility:visible;opacity:1;transform:translateY(0) scale(1);transition:opacity 0.15s ease,transform 0.15s ease,visibility 0s linear 0s}
        @keyframes atom-spinner-animation-1 {
          0% { transform: rotateZ(120deg) rotateX(66deg) rotateZ(0deg); }
          100% { transform: rotateZ(120deg) rotateX(66deg) rotateZ(360deg); }
        }
        @keyframes atom-spinner-animation-2 {
          0% { transform: rotateZ(240deg) rotateX(66deg) rotateZ(0deg); }
          100% { transform: rotateZ(240deg) rotateX(66deg) rotateZ(360deg); }
        }
        @keyframes atom-spinner-animation-3 {
          0% { transform: rotateZ(360deg) rotateX(66deg) rotateZ(0deg); }
          100% { transform: rotateZ(360deg) rotateX(66deg) rotateZ(360deg); }
        }

        .atom-line {
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          border-left-width: 3px;
          border-left-color: #5865F2;
          border-top-width: 0px;
        }
          @keyframes skeleton-glow {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        .skeleton-box {
          background: linear-gradient(90deg, oklch(var(--b2)) 25%, oklch(var(--b3)) 50%, oklch(var(--b2)) 75%);
          background-size: 200% 100%;
          animation: skeleton-glow 1.5s infinite linear;
        }
      `}</style>

      <ProfilPopover 
        profilPopover={profilPopover}
        setProfilPopover={setProfilPopover}
        getAvatarUrlForDisplay={getAvatarUrlForDisplay}
        getStatutEffectif={getStatutEffectif}
        demarrerDM={demarrerDM}
        session={session}
        amis={amis}
        demandesAmis={demandesAmis}
        ajouterToast={ajouterToast}
      />

      {menuContextuel && (
        <div className={`fixed z-[70] bg-base-100 rounded-xl shadow-2xl border border-base-200 py-2 w-52 text-sm overflow-hidden ${menuFermeture ? 'menu-contextuel-exit' : 'menu-contextuel-enter'}`}
          style={{ top: menuContextuel.y, left: menuContextuel.x }}>
          <div className="px-3 pb-2 mb-1 border-b border-base-200 font-bold text-xs text-gray-400 truncate uppercase tracking-wider">
            {menuContextuel.message.username}
          </div>
          <div className="flex items-center justify-around px-3 py-2 mb-1 border-b border-base-200">
            {emojisDispos.map((emoji, i) => {
              const live = messages.find(m => m.id === menuContextuel.message.id);
              const dejaReagi = live?.reactions?.some(r => r.username === monPseudoAffiche && r.emoji === emoji);
              
              return (
                <button key={emoji} 
                  className={`emoji-btn text-xl transition-all duration-100 rounded-lg p-1 hover:scale-125 active:scale-95 ${
                    dejaReagi ? 'bg-primary/15 ring-1 ring-primary/40' : 'hover:bg-base-200'
                  }`}
                  style={{ animationDelay: `${i * 30}ms`, opacity: 0 }}
                  onClick={() => { toggleReaction(menuContextuel.message.id, emoji); fermerMenuContextuel(); }}>
                  {emoji}
                </button>
              );
            })}
          </div>
          <ul className="menu p-0">
<li>
  <a onClick={() => { 
    setReponseA(menuContextuel.message); 
    fermerMenuContextuel(); 
    setTimeout(() => inputMessageRef.current?.focus(), 10); 
  }}>
    <Reply size={16} /> Répondre
  </a>
</li>
  
  <li>
    <a onClick={() => { 
      navigator.clipboard.writeText(menuContextuel.message.content || ""); 
      ajouterToast("Texte copié !", "success");
      fermerMenuContextuel(); 
    }}>
      <Copy size={16} /> Copier le texte
    </a>
  </li>

  {menuContextuel.message.username === monPseudoAffiche && (<>
    <li><a onClick={() => { setMessageEnEdition(menuContextuel.message.id); setTexteEdition(menuContextuel.message.content); fermerMenuContextuel(); }}><Pencil size={16} /> Modifier</a></li>
    <li><a className="text-error hover:bg-error/10 hover:text-error" onClick={() => { supprimerMessage(menuContextuel.message.id); fermerMenuContextuel(); }}><Trash size={16} /> Supprimer</a></li>
  </>)}
</ul>
        </div>
      )}
      <ServerSidebar
        servers={servers}
        setServers={setServers}
        serverActuel={serverActuel} 
        isHome={!serverActuel && vueActive !== 'explorer'}
        notifications={notifications}
        groups={groups}
        setGroups={setGroups}
        memberMeta={memberMeta}
        setMemberMeta={setMemberMeta}
        ping={ping}
        onSelectHome={() => { 
          setServerActuel(null); 
          setVueActive('chat');
          localStorage.removeItem('chat_server_id'); 
          localStorage.removeItem('chat_channel_id'); 
        }}
        onSelectServer={(srv, ch) => { 
          setServerActuel(srv); 
          setServerChannel(ch); 
          setVueActive('chat');
          localStorage.setItem('chat_server_id', srv.id);
          if (ch) {
            localStorage.setItem('chat_channel_id', ch.id);
          } else {
            localStorage.removeItem('chat_channel_id');
          }
        }}
        onSelectExplorer={() => { 
          setServerActuel(null); 
          setVueActive('explorer'); 
          chargerPublicServers(); 
        }}
        onLeaveServer={(serverId) => {
          setServers(prev => prev.filter(s => s.id !== serverId));
          if (serverActuel?.id === serverId) { setServerActuel(null); setVueActive('chat'); }
        }}
        vueActive={vueActive}
        notifsDMs={totalNotifsDMs}
        demandesEnAttente={demandesEnAttente}
      />
      {serverActuel ? (
        <ServerView
          key={serverActuel.id}
          notifications={notifications}
          server={serverActuel} 
          initialChannel={serverChannel}
          profilsCache={profilsCache}
          getStatutEffectif={getStatutEffectif}
          demanderConfirmation={demanderConfirmation}
          onLeave={() => { 
            setServers(prev => prev.filter(s => s.id !== serverActuel.id)); 
            setServerActuel(null); 
            setVueActive('chat');
          }}
          onUserClick={gererClicProfil}
          getAvatarUrl={getAvatarUrlForDisplay}
          onChannelSelect={(ch) => { 
            setServerChannel(ch); 
            localStorage.setItem('chat_channel_id', ch.id); 
            setNotifications(prev => { 
              const n = {...prev}; 
              delete n[`server-${serverActuel.id}-${ch.id}`]; 
              return n; 
            }); 
          }}
          onOpenParametres={() => { 
            setServerPrecedent(serverActuel);
            setServerActuel(null); 
            ouvrirParametres(); 
          }}
          onLogout={() => demanderConfirmation("Se déconnecter ?", seDeconnecter, false)}
        />
      ) : (
      <div className="flex-1 flex overflow-hidden relative">

      

        <SidebarDMs
          salonActuel={salonActuel}
          changerSalon={changerSalon}
          vueActive={vueActive}
          demandesAmis={demandesAmis}
          salonsPrives={salonsPrives}
          profilsCache={profilsCache}
          utilisateursEnLigne={utilisateursEnLigne}
          getStatutEffectif={getStatutEffectif}
          getAvatarUrlForDisplay={getAvatarUrlForDisplay}
          notifications={notifications}
          supprimerSalonDM={supprimerSalonDM}
          ouvrirParametres={ouvrirParametres}
          demanderConfirmation={demanderConfirmation}
          seDeconnecter={seDeconnecter}
        />
          
      <div className="flex-1 flex flex-col h-screen relative bg-base-100">
        

        {vueActive === 'parametres' ? (
          <VueParametres 
            session={session}
            monProfil={monProfil}
            monPseudoAffiche={monPseudoAffiche}
            setVueActive={setVueActive}
            ongletParametres={ongletParametres}
            setOngletParametres={setOngletParametres}
            editPseudo={editPseudo}
            setEditPseudo={setEditPseudo}
            editBio={editBio}
            setEditBio={setEditBio}
            editStatut={editStatut}
            setEditStatut={setEditStatut}
            editAvatarUrl={editAvatarUrl}
            editPassword={editPassword}
            setEditPassword={setEditPassword}
            uploadAvatarEnCours={uploadAvatarEnCours}
            sauvegardeEnCours={sauvegardeEnCours}
            avatarInputRef={avatarInputRef}
            handleAvatarUpload={handleAvatarUpload}
            sauvegarderParametres={sauvegarderParametres}
            changerMotDePasse={changerMotDePasse}
            supprimerMonCompte={supprimerMonCompte}
            getAvatarUrlForDisplay={getAvatarUrlForDisplay}
            serverPrecedent={serverPrecedent}
            setServerActuel={setServerActuel}
            setServerPrecedent={setServerPrecedent}
            themeActuel={themeActuel}
            setThemeActuel={setThemeActuel}
            demanderConfirmation={demanderConfirmation}
    blockedUsers={blockedUsers}
  chargerBlocages={chargerBlocages}
  profilsCache={profilsCache}
  ajouterToast={ajouterToast}
          />
        ) : vueActive === 'explorer' ? (
          <VueExplorateur 
            rechercheExplorer={rechercheExplorer}
            setRechercheExplorer={setRechercheExplorer}
            explorerLoading={explorerLoading}
            publicServers={publicServers}
            servers={servers}
            rejoindreServeurPublic={rejoindreServeurPublic}
          />
        ) : salonActuel ? (
          <>
            <div className="bg-base-100 p-4 border-b border-base-200 flex items-center gap-2 font-bold shadow-sm z-10">
              
              <BurgerButton />

              {salonActuel.startsWith('dm_') ? (
                <img 
                  src={getAvatarUrlForDisplay(targetId)} 
                  alt="Avatar"
                  onClick={(e) => gererClicProfil(e, profilsCache[targetId]?.pseudo)}
                  className="w-8 h-8 rounded-full object-cover cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all shadow-sm shrink-0"
                />
              ) : (
                <Hash size={20} className="text-gray-400 shrink-0"/>
              )}
              <span className="flex-1">{getNomSalonAffichage()}</span>
              
              <button onClick={() => { setRechercheOuverte(v => !v); setRechercheQuery(''); setRechercheResultats([]); }}
                className={`btn btn-ghost btn-sm btn-circle transition-colors ${rechercheOuverte ? 'text-primary bg-primary/10' : 'text-gray-400 hover:text-primary'}`}>
                <Search size={18} />
              </button>
            </div>

            {rechercheOuverte && (
              <div className="bg-base-100 border-b border-base-200 shadow-md z-10">
                <div className="p-3 flex gap-2 items-center">
                  <div className="relative flex-1">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input ref={rechercheRef} autoFocus type="text" placeholder="Rechercher dans tous les messages…"
                      className="input input-bordered input-sm w-full pl-9" value={rechercheQuery}
                      onChange={e => { setRechercheQuery(e.target.value); lancerRecherche(e.target.value); }}
                      onKeyDown={e => e.key === 'Escape' && setRechercheOuverte(false)} />
                    {rechercheEnCours && <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-gray-400" />}
                  </div>
                  <button onClick={() => setRechercheOuverte(false)} className="btn btn-ghost btn-sm btn-circle text-gray-400"><X size={16}/></button>
                </div>
                {rechercheResultats.length > 0 && (
                  <div className="max-h-72 overflow-y-auto border-t border-base-200 divide-y divide-base-200">
                    {rechercheResultats.map(msg => (
                      <button key={msg.id} onClick={() => allerAuMessage(msg.id, msg.room)} className="w-full text-left px-4 py-2.5 hover:bg-base-200 transition-colors flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <img src={getAvatarUrlForDisplay(msg.username)} className="w-5 h-5 rounded-full flex-shrink-0 object-cover" />
                          <span className="font-bold text-xs text-base-content">{msg.username}</span>
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ml-auto flex-shrink-0 ${msg.room === salonActuel ? 'bg-primary/15 text-primary' : 'bg-base-300 text-gray-500'}`}>
                            {msg.room.startsWith('dm_') ? '@ DM' : `# ${msg.room}`}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 truncate pl-7">{surlignerTexte(msg.content, rechercheQuery)}</p>
                      </button>
                    ))}
                  </div>
                )}
                {rechercheQuery.trim() && !rechercheEnCours && rechercheResultats.length === 0 && (
                  <div className="px-4 py-3 text-xs text-gray-400 text-center border-t border-base-200">Aucun résultat pour « {rechercheQuery} »</div>
                )}
              </div>
            )}

            {afficherNotif && (
              <button onClick={() => { scrollerVersLeBas(); setPremierNonLuId(null); if (messages.length > 0) localStorage.setItem(`chat_dernier_lu_${salonActuel}`, messages[messages.length - 1].id.toString()); }}
                className="absolute top-14 left-0 w-full z-20 bg-primary/95 backdrop-blur text-primary-content font-bold text-sm py-3 shadow-md flex justify-center items-center gap-3 hover:bg-primary transition-colors cursor-pointer border-b border-primary-content/20">
                <span>Nouveaux messages en bas</span>
                <div className="bg-primary-content/20 rounded-full p-1 animate-bounce"><ArrowDown size={16} /></div>
              </button>
            )}

            <div className="flex-1 p-4 overflow-y-auto bg-base-100 flex flex-col gap-4 relative" ref={conteneurMessagesRef} onScroll={gererScroll}>
              {chargementAnciens && <div className="flex justify-center py-2"><Loader2 size={18} className="animate-spin text-gray-400" /></div>}
              {tousCharges && !chargementAnciens && messages.length > 0 && (
                <div className="flex items-center gap-3 my-2 px-2">
                  <div className="flex-1 h-px bg-base-300"></div>
                  <span className="text-[11px] text-gray-400 whitespace-nowrap">Début de l'historique</span>
                  <div className="flex-1 h-px bg-base-300"></div>
                </div>
              )}

              {messages.map((msg, index) => {
                const messagePrecedent = index > 0 ? messages[index - 1] : null;
                const messageParent = msg.reply_to_id ? messages.find(m => m.id === msg.reply_to_id) : null;
                const estPremierNonLu = msg.id === premierNonLuId;

                let auteurTech = msg.username;
                Object.keys(profilsCache).forEach(k => { if(profilsCache[k].pseudo === msg.username) auteurTech = k; });
                const statutAuteur = getStatutEffectif(auteurTech, profilsCache[auteurTech]);

                return (
                  <MessageItem
                    key={msg.id}
                    msg={msg}
                    messagePrecedent={messagePrecedent}
                    monPseudoAffiche={monPseudoAffiche}
                    profilAuteur={profilsCache[auteurTech]}
                    statutAuteur={statutAuteur}
                    messageParent={messageParent}
                    estPremierNonLu={estPremierNonLu}
                    ligneNonLuRef={ligneNonLuRef}
                    messagesRefsMap={messagesRefsMap}
                    messageEnEdition={messageEnEdition}
                    texteEdition={texteEdition}
                    setTexteEdition={setTexteEdition}
                    sauvegarderModification={sauvegarderModification}
                    setMessageEnEdition={setMessageEnEdition}
                    ouvrirMenuContextuel={ouvrirMenuContextuel}
                    gererClicProfil={gererClicProfil}
                    allerAuMessage={allerAuMessage}
                    salonActuel={salonActuel}
                    rechercheQuery={rechercheQuery}
                    toggleReaction={toggleReaction}
                    getAvatarUrlForDisplay={getAvatarUrlForDisplay}
                  />
                );
              })}
              <div ref={finDesMessagesRef} />
            </div>

            {jeLaiBloque ? (
              <div className="flex flex-col items-center justify-center p-5 mx-4 mb-4 bg-base-200/50 rounded-xl border border-base-300 shadow-inner">
                <span className="text-base-content/70 font-medium mb-3">Vous avez bloqué cet utilisateur.</span>
                <button
                  onClick={async () => {
                    await supabase.from('blocked_users').delete().match({ blocker_id: session.user.id, blocked_id: targetId });
                    chargerBlocages();
                  }}
                  className="btn btn-sm btn-outline btn-error"
                >
                  Débloquer
                </button>
              </div>
            ) : ilMaBloque ? (
              <div className="flex items-center justify-center p-5 mx-4 mb-4 bg-base-200/50 rounded-xl border border-base-300 shadow-inner">
                <span className="text-base-content/70 font-medium italic">Cet utilisateur vous a bloqué.</span>
              </div>
            ) : (
          <ZoneSaisie 
              nouveauMessage={nouveauMessage}
              setNouveauMessage={setNouveauMessage}
              reponseA={reponseA}
              setReponseA={setReponseA}
              fichierPreview={fichierPreview}
              setFichierPreview={setFichierPreview}
              isUploading={isUploading}
              gifOuvert={gifOuvert}
              setGifOuvert={setGifOuvert}
              gifQuery={gifQuery}
              setGifQuery={setGifQuery}
              gifChargement={gifChargement}
              gifResultats={gifResultats}
              gifTendances={gifTendances}
              emojiOuvert={emojiOuvert}
              setEmojiOuvert={setEmojiOuvert}
              showAideFormat={showAideFormat}
              aideFormatFermeture={aideFormatFermeture}
              toggleAideFormat={toggleAideFormat}
              utilisateursEnTrain={utilisateursEnTrain}
              dernierTexteTypingRef={dernierTexteTypingRef}
              inputRef={inputRef}

              commandeQuery={commandeQuery}
              commandeIndex={commandeIndex}
              setCommandeIndex={setCommandeIndex}
              fermerMenuCommande={reinitialiserMenuCommande}
              insererCommande={(nomCommande) => {
                setNouveauMessage(`${nomCommande} `);
                reinitialiserMenuCommande();
                inputMessageRef.current?.focus();
              }}

              placeholder={salonActuel.startsWith('dm_') ? 'Message privé...' : `Écrire dans #${salonActuel}...`}
              pseudoActuel={monPseudoAffiche}

              mentionMenuOuvert={mentionQuery !== null}
              mentionsFiltrees={
                (mentionQuery !== null) ? amis
                  .map(f => {
                    const idAmi = f.requester_id === session.user.id ? f.receiver_id : f.requester_id;
                    return Object.values(profilsCache).find(p => p.id === idAmi);
                  })
                  .filter(p => p && p.pseudo.toLowerCase().includes(mentionQuery.toLowerCase()))
                  .map(p => ({ pseudo: p.pseudo, avatar_url: p.avatar_url })) : []
              }
              mentionIndex={mentionIndex}
              setMentionIndex={setMentionIndex}
              fermerMenuMention={() => setMentionQuery(null)}
              insererMention={(pseudoAmi) => {
                const words = nouveauMessage.split(/\s/);
                words[words.length - 1] = `@${pseudoAmi} `;
                setNouveauMessage(words.join(' '));
                setMentionQuery(null);
                inputMessageRef.current?.focus();
              }}

              inputMessageRef={inputMessageRef}
              emojiTriggerRef={emojiTriggerRef}
              fichierInputRef={fichierInputRef}
              gererFrappe={gererFrappe}
              envoyerMessage={envoyerMessage}
              envoyerFichier={envoyerFichier}
              confirmerEnvoiFichier={confirmerEnvoiFichier}
              ouvrirGif={ouvrirGif}
              rechercherGifs={rechercherGifs}
              envoyerGif={envoyerGif}
              insererEmoji={insererEmoji}
          />
          )}
        </> 
      ) : (
          <HubAmis 
            ongletAmis={ongletAmis}
            setOngletAmis={setOngletAmis}
            demandesAmis={demandesAmis}
            amis={amis}
            rechercheAmi={rechercheAmi}
            setRechercheAmi={setRechercheAmi}
            ajoutAmiLoading={ajoutAmiLoading}
            envoyerDemandeAmi={envoyerDemandeAmi}
            repondreDemandeAmi={repondreDemandeAmi}
            supprimerAmi={supprimerAmi}
            demarrerDM={demarrerDM}
            getAvatarUrlForDisplay={getAvatarUrlForDisplay}
            getProfilAmi={getProfilAmi}
            getStatutEffectif={getStatutEffectif}
            onUserClick={gererClicProfil}
          />
        )}
      </div>
      </div>
      )}

      {showWelcome && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-base-100 p-8 rounded-3xl shadow-2xl max-w-sm text-center animate-[modalIn_0.2s_ease_forwards]">
            <h3 className="text-2xl font-black mb-4">Bienvenue sur Talk !</h3>
            <p className="text-gray-500 mb-8">Voulez-vous suivre un court guide pour découvrir l'interface ?</p>
            <div className="flex gap-3">
              <button onClick={refuserGuide} className="btn btn-ghost flex-1 transition-transform active:scale-95">Non, merci</button>
              <button onClick={accepterGuide} className="btn btn-primary flex-1 shadow-md hover:shadow-lg transition-all active:scale-95">C'est parti !</button>
            </div>
          </div>
        </div>
      )}

      {showGuide && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xl animate-fade-in" />
          <div className="relative bg-base-100 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-[modalIn_0.3s_ease_forwards] border border-white/10">
            
            <div className="h-1.5 w-full bg-base-300">
              <div className="h-full bg-primary transition-all duration-500" style={{ width: `${((guideStep + 1) / 5) * 100}%` }} />
            </div>

            <div className="p-8 text-center">
              {guideStep === 0 && (
                <div className="animate-fade-in">
                  <div className="w-20 h-20 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-6"><Hash size={40}/></div>
                  <h3 className="text-xl font-black mb-3">La barre des serveurs</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">Sur la gauche, vous trouverez tous vos serveurs. Vous pouvez les organiser dans des dossiers par simple glisser-déposer, ou faire un clic droit pour les gérer.</p>
                </div>
              )}

              {guideStep === 1 && (
                <div className="animate-fade-in">
                  <div className="w-20 h-20 bg-info/10 text-info rounded-2xl flex items-center justify-center mx-auto mb-6"><Compass size={40}/></div>
                  <h3 className="text-xl font-black mb-3">L'Explorateur</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">Cliquez sur la boussole pour découvrir de nouvelles communautés publiques et rejoindre des serveurs qui partagent vos thématiques favorites.</p>
                </div>
              )}

              {guideStep === 2 && (
                <div className="animate-fade-in">
                  <div className="w-20 h-20 bg-success/10 text-success rounded-2xl flex items-center justify-center mx-auto mb-6"><MessageCircle size={40}/></div>
                  <h3 className="text-xl font-black mb-3">Messages Privés</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">L'icône de bulle en haut à gauche vous permet de discuter en privé avec vos amis et de gérer vos demandes d'ajout facilement.</p>
                </div>
              )}

              {guideStep === 3 && (
                <div className="animate-fade-in">
                  <div className="w-20 h-20 bg-warning/10 text-warning rounded-2xl flex items-center justify-center mx-auto mb-6"><Palette size={40}/></div>
                  <h3 className="text-xl font-black mb-3">Personnalisation</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">En cliquant sur l'engrenage en bas à gauche, accédez à vos paramètres pour changer l'apparence du site, votre pseudo et votre statut.</p>
                </div>
              )}

              {guideStep === 4 && (
                <div className="animate-fade-in">
                  <div className="w-20 h-20 bg-secondary/10 text-secondary rounded-2xl flex items-center justify-center mx-auto mb-6"><Search size={40}/></div>
                  <h3 className="text-xl font-black mb-3">Recherche Rapide</h3>
                  <p className="text-gray-500 text-sm leading-relaxed mb-5">
                    Besoin d'aller vite ? Naviguez instantanément entre vos serveurs sans toucher à la souris grâce au menu de recherche rapide.
                  </p>
                  <div className="flex items-center justify-center gap-2 opacity-80 bg-base-200/50 w-max mx-auto px-5 py-2.5 rounded-xl border border-base-300">
                    <kbd className="kbd kbd-sm bg-base-100 shadow-sm font-sans">Ctrl</kbd>
                    <span className="text-xs font-bold text-base-content/40">+</span>
                    <kbd className="kbd kbd-sm bg-base-100 shadow-sm font-sans">K</kbd>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between mt-10">
                <button onClick={() => guideStep > 0 ? setGuideStep(gs => gs - 1) : terminerGuide()} className="btn btn-ghost btn-sm font-bold">
                  {guideStep === 0 ? 'Quitter' : 'Retour'}
                </button>
                <div className="flex gap-1.5">
                  {[0, 1, 2, 3, 4].map(i => <div key={i} className={`w-2 h-2 rounded-full transition-colors duration-300 ${guideStep === i ? 'bg-primary' : 'bg-base-300'}`} />)}
                </div>
                {guideStep < 4 ? (
                  <button onClick={() => setGuideStep(gs => gs + 1)} className="btn btn-primary btn-sm px-6 shadow-md font-bold">Suivant</button>
                ) : (
                  <button onClick={terminerGuide} className="btn btn-success btn-sm px-6 text-white font-bold shadow-md">C'est parti !</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showAfkModal && (
        <div className="fixed inset-0 bg-black/50 z-[99999] flex items-center justify-center backdrop-blur-sm transition-opacity">
          <div className="bg-base-100 p-6 rounded-xl shadow-xl max-w-sm w-full border border-base-200 animate-[modalIn_0.2s_ease_forwards]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-base-200 text-base-content/80 rounded-full flex items-center justify-center shrink-0">
                <Clock size={20} />
              </div>
              <h2 className="text-lg font-bold text-base-content">Toujours avec nous ?</h2>
            </div>
            
            <p className="text-sm text-base-content/70 mb-6 leading-relaxed">
              Suite à une période d'inactivité, votre session expirera automatiquement dans <span className="font-bold text-base-content">{afkCountdown} secondes</span>.
            </p>
            
            <button
              onClick={() => setShowAfkModal(false)}
              className="btn btn-primary w-full"
            >
              Rester connecté
            </button>
          </div>
        </div>
      )}

    </div>
    </AppProvider>
  );
} 