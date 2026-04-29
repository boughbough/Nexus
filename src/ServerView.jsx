import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import MessageItem from './MessageItem';
import { VolumeX, ShieldAlert, Copy, Hash, Send, Settings,Info, Plus, Loader2, LogOut, ImagePlus, X, Reply, Trash, Pencil, Users, Smile, Search, ArrowDown, FileText, FileVideo, File, Music, Crown, ShieldCheck, Shield, User, Pin, Menu } from 'lucide-react';
import { supabase } from './supabase';
import ServerSettings from './ServerSettings';
import ReactMarkdown from 'react-markdown';
import EmojiPicker from './EmojiPicker';

import ZoneSaisie from './ZoneSaisie';
import PanneauMembres from './PanneauMembres';
import PanneauEpingles from './PanneauEpingles';
import MessageSkeleton from "./contexts/MessageSkeleton";
import { useAuth } from './contexts/AuthContext';
import { useUI } from './contexts/UIContext';

const STATUTS = {
  en_ligne:  { label: 'En ligne',  dot: 'bg-success',  text: 'text-success' },
  occupe:    { label: 'Occupé',    dot: 'bg-warning',  text: 'text-warning' },
  absent:    { label: 'Absent',    dot: 'bg-error',    text: 'text-error'   },
  invisible: { label: 'Invisible', dot: 'bg-gray-400', text: 'text-gray-400'},
};


export default function ServerView({ server: initialServer, initialChannel, profilsCache, getStatutEffectif, onLeave, onUserClick, getAvatarUrl, notifications, onChannelSelect, onOpenParametres, onLogout, demanderConfirmation }) {
  const [channels, setChannels] = useState([]);
  const [channelsLoaded, setChannelsLoaded] = useState(false);
  const [channelActuel, setChannelActuel] = useState(initialChannel);
  const [server, setServer] = useState(initialServer);
  const [messages, setMessages] = useState([]);
  const [membres, setMembres] = useState([]);
  const [epinglesPanel, setEpinglesPanel] = useState(false);
  const [monRole, setMonRole] = useState('member');
  const estAdmin = ['owner', 'admin'].includes(monRole);
  const estModerateur = ['owner', 'admin', 'moderator'].includes(monRole);
  const [mentionMenu, setMentionMenu] = useState({ ouvert: false, recherche: '', index: -1 });
  const [membresFiltres, setMembresFiltres] = useState([]);
  const [mentionIndex, setMentionIndex] = useState(0);
  const [tempsRestantSlowmode, setTempsRestantSlowmode] = useState(0);

  const [mutedUntil, setMutedUntil] = useState(null);
const estMuet = mutedUntil && new Date(mutedUntil) > new Date();

const { session, monProfil, pseudo, blockedUsers, blockedBy, chargerBlocages } = useAuth();
  const { ajouterToast, toggleMenuMobile } = useUI();
  const [nouveauMessage, setNouveauMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [settingsOuvert, setSettingsOuvert] = useState(false);
  const [ongletInitialSettings, setOngletInitialSettings] = useState('general');
  const [reponseA, setReponseA] = useState(null);
  const [messageEnEdition, setMessageEnEdition] = useState(null);
  const [texteEdition, setTexteEdition] = useState('');
  const [membresPanel, setMembresPanel] = useState(false);
  const [chargement, setChargement] = useState(false);
  const [utilisateursEnTrain, setUtilisateursEnTrain] = useState([]);
  const canalTypingRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const dernierTexteTypingRef = useRef(null);
  const scrollContainerRef = useRef(null);

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

  const [menuStatutOuvert, setMenuStatutOuvert] = useState(false);
  const menuStatutRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuStatutRef.current && !menuStatutRef.current.contains(event.target)) {
        setMenuStatutOuvert(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const changerStatut = async (nouveauStatut) => {
    setMenuStatutOuvert(false);
    if (session?.user?.id) {
      await supabase.from('profiles').update({ statut: nouveauStatut }).eq('id', session.user.id);
    }
  };

  const [fichierPreview, setFichierPreview] = useState(null);
  const fichierInputRef = useRef(null);

  const [gifOuvert, setGifOuvert] = useState(false);
  const [emojiOuvert, setEmojiOuvert] = useState(false);
  const [gifQuery, setGifQuery] = useState('');
  const [gifResultats, setGifResultats] = useState([]);
  const [gifTendances, setGifTendances] = useState([]);
  const [gifChargement, setGifChargement] = useState(false);
  const emojiTriggerRef = useRef(null);
  const inputMessageRef = useRef(null);
  const GIPHY_KEY = import.meta.env.VITE_GIPHY_KEY;

  const [menuContextuel, setMenuContextuel] = useState(null);
  const [menuFermeture, setMenuFermeture] = useState(false);
  const menuFermetureTimeout = useRef(null);
  const emojisDispos = ["👍", "❤️", "😂", "🔥", "👀"];

  const conteneurRef = useRef(null);
  const ligneNonLuRef = useRef(null);
  const inputRef = useRef(null);
  const messagesRefsMap = useRef({});
  const lastTypeTime = useRef(0);
  const dernierMessageTempsRef = useRef(0);

  const allerAuMessage = (msgId) => {
    const el = messagesRefsMap.current[msgId];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-2', 'ring-primary', 'rounded-xl', 'transition-all', 'duration-500');
      setTimeout(() => el.classList.remove('ring-2', 'ring-primary', 'rounded-xl'), 2000);
    }
  };

  const [messagesEpingles, setMessagesEpingles] = useState([]);

  const [hasNewMessagesBelow, setHasNewMessagesBelow] = useState(false);


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

  const formaterDateSeparateur = (dateISO) => {
    const d = new Date(dateISO), auj = new Date(), hier = new Date();
    hier.setDate(auj.getDate() - 1);
    if (d.toDateString() === auj.toDateString()) return "Aujourd'hui";
    if (d.toDateString() === hier.toDateString()) return "Hier";
    return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  const estUtilisateurSupprime = (nom) => nom === '[supprimé]';

  useEffect(() => { chargerChannels(); chargerMembres(); }, [server.id]);

  useEffect(() => {
    if (!channelActuel) return;
    const canalBroadcast = supabase.channel(`broadcast-typing-${server.id}`);
    
    canalBroadcast
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        const { pseudo: p, salon, typing } = payload;
        if (!p || p === pseudo || salon !== channelActuel.id) return;
        
        if (timeoutFrappe.current[p]) {
          clearTimeout(timeoutFrappe.current[p]);
        }
        
        if (typing) {
          setUtilisateursEnTrain(prev => prev.includes(p) ? prev : [...prev, p]);
          timeoutFrappe.current[p] = setTimeout(() => {
            setUtilisateursEnTrain(prev => prev.filter(x => x !== p));
          }, 3000);
        } else {
          setUtilisateursEnTrain(prev => prev.filter(x => x !== p));
        }
      })
      .subscribe((status) => { 
        if (status === 'SUBSCRIBED') canalTypingRef.current = canalBroadcast; 
      });
    
    return () => {
      supabase.removeChannel(canalBroadcast);
      canalTypingRef.current = null;
    };
  }, [server.id, channelActuel?.id, pseudo]);

  const gererFrappe = (e) => {
    const val = e.target.value;
    setNouveauMessage(val);

    const now = Date.now();
    if (now - lastTypeTime.current > 2000) {
      if (canalTypingRef.current) { 
        canalTypingRef.current.send({
          type: 'broadcast',
          event: 'typing',
          payload: { 
            pseudo: pseudo, 
            salon: channelActuel?.id, 
            typing: true 
          } 
        });
      }
      lastTypeTime.current = now;
    }

    const cursorPosition = e.target.selectionStart;
    const textBeforeCursor = val.slice(0, cursorPosition);
    const words = textBeforeCursor.split(/\s/);
    const lastWord = words[words.length - 1];

    if (lastWord.startsWith('@')) {
      setMentionMenu({ ouvert: true, recherche: lastWord.slice(1).toLowerCase(), index: 0 });
      const search = lastWord.slice(1).toLowerCase();
      
      const filtres = membres.filter(m => m.pseudo !== pseudo && m.pseudo.toLowerCase().includes(search));
      
      setMembresFiltres(filtres);
    } else {
      setMentionMenu({ ouvert: false, recherche: '', index: -1 });
    }
  };

  const insererMention = (membrePseudo) => {
    const debut = nouveauMessage.slice(0, mentionMenu.index);
    const fin = nouveauMessage.slice(mentionMenu.index + mentionMenu.recherche.length + 1);
    setNouveauMessage(`${debut}@${membrePseudo} ${fin}`);
    setMentionMenu({ ouvert: false, recherche: '', index: -1 });
    setTimeout(() => inputMessageRef.current?.focus(), 10);
  };

  useEffect(() => {
    if (!channelActuel) return;
    const canal = supabase.channel(`server-${server.id}-ch-${channelActuel.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `channel_id=eq.${channelActuel.id}` },
        ({ new: msg }) => { 
          setMessages(prev => [...prev, { ...msg, reactions: [] }]); 
          
          scrollBas(msg.username === pseudo); 
        })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'messages', filter: `channel_id=eq.${channelActuel.id}` },
        ({ old }) => setMessages(prev => prev.filter(m => m.id !== old.id)))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `channel_id=eq.${channelActuel.id}` },
        ({ new: msg }) => {
          setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, ...msg } : m));
          setMessagesEpingles(prev => {
            if (msg.pinned && !prev.find(p => p.id === msg.id)) return [msg, ...prev].sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
            if (!msg.pinned) return prev.filter(p => p.id !== msg.id);
            return prev.map(p => p.id === msg.id ? msg : p);
          });
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
    return () => supabase.removeChannel(canal);
  }, [channelActuel?.id]);

  useEffect(() => {
    const canal = supabase.channel(`server-channels-${server.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'server_channels', filter: `server_id=eq.${server.id}` }, (payload) => {
        chargerChannels(); 
        if (payload.eventType === 'DELETE' && payload.old.id === channelActuel?.id) {
          setChannelActuel(null);
        }
      })
      .subscribe();
    return () => supabase.removeChannel(canal);
  }, [server.id, channelActuel]);

  useEffect(() => {
    const canalMembres = supabase.channel(`server-members-${server.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'server_members', filter: `server_id=eq.${server.id}` }, () => {
        chargerMembres();
      })
      .subscribe();
    return () => supabase.removeChannel(canalMembres);
  }, [server.id]);

  const scrollBas = (force = false) => {
    const faireScroll = () => {
      if (!conteneurRef.current) return;
      
      const el = conteneurRef.current;
      const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 500;

      if (force || isAtBottom) {
        el.scrollTop = el.scrollHeight;
        setHasNewMessagesBelow(false);
      } else {
        setHasNewMessagesBelow(true);
      }
    };

    requestAnimationFrame(faireScroll); 
    setTimeout(faireScroll, 150);
    setTimeout(faireScroll, 600);
  };

  useEffect(() => {
    const conteneur = conteneurRef.current;
    if (!conteneur) return;

    const handleScroll = () => {
      const isAtBottom = conteneur.scrollHeight - conteneur.scrollTop - conteneur.clientHeight < 50;
      if (isAtBottom) {
        setHasNewMessagesBelow(false);
      }
    };

    conteneur.addEventListener('scroll', handleScroll);
    return () => conteneur.removeEventListener('scroll', handleScroll);
  }, []);

  const chargerChannels = async () => {
    const { data } = await supabase.from('server_channels').select('*').eq('server_id', server.id).order('position');
    setChannels(data || []);
    
    if (!channelActuel && data?.length > 0) {
      setChannelActuel(data[0]);
    } else if (channelActuel && data) {
      const salonMisAJour = data.find(c => c.id === channelActuel.id);
      if (salonMisAJour) {
        setChannelActuel(salonMisAJour);
      }
    }
    
    setChannelsLoaded(true);
  };

  const chargerMembres = async () => {
    const { data, error } = await supabase
      .from('server_members')
      .select('*, profiles:user_id(pseudo, avatar_url)') 
      .eq('server_id', server.id);

    if (error) {
      onLeave();
      ajouterToast("Vous avez été retiré du serveur.", "error");
      return;
    }

    const membresAjour = data?.map(m => {
      const profilFrais = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
      
      return {
        ...m,
        pseudo: profilFrais?.pseudo || m.pseudo,
        avatar_url: profilFrais?.avatar_url || m.avatar_url
      };
    }) || [];

    setMembres(membresAjour);
    
    const moi = membresAjour.find(m => m.user_id === session?.user?.id);
    if (moi) {
      setMonRole(moi.role);
    } else {
      onLeave();
      ajouterToast("Vous ne faites plus partie de ce serveur.", "error");
    }
  };

  const chargerMessages = async () => {
    setChargement(true);
    const { data } = await supabase.from('messages').select('*, reactions(*)').eq('channel_id', channelActuel.id).order('created_at', { ascending: false }).limit(50);
    setMessages((data || []).reverse());
    setChargement(false);
  };

  useEffect(() => {
    if (channelActuel) {
      chargerMessages();
      onChannelSelect?.(channelActuel);
    }
  }, [channelActuel?.id]);

  const chargerEpingles = async () => {
    if (!channelActuel) return;
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('channel_id', channelActuel.id)
      .eq('pinned', true)
      .order('created_at', { ascending: false });
    setMessagesEpingles(data || []);
  };

  useEffect(() => {
    if (epinglesPanel) chargerEpingles();
  }, [channelActuel?.id, epinglesPanel]);

  const ouvrirMenuContextuel = (e, message) => {
    e.preventDefault();
    if (menuFermetureTimeout.current) clearTimeout(menuFermetureTimeout.current);
    const decalageY = window.innerHeight - e.clientY < 220 ? e.clientY - 220 : e.clientY;
    const decalageX = window.innerWidth - e.clientX < 200 ? e.clientX - 200 : e.clientX;
    setMenuFermeture(false);
    setMenuContextuel({ message, x: decalageX, y: decalageY }); 
  };
  
  const fermerMenuContextuel = () => {
    setMenuFermeture(true);
    menuFermetureTimeout.current = setTimeout(() => { setMenuContextuel(null); setMenuFermeture(false); }, 150);
  };
  
  useEffect(() => {
    if (!menuContextuel) return;
    const handler = (e) => { if (e.button !== 2) fermerMenuContextuel(); };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, [menuContextuel]);

  const toggleReaction = async (messageId, emoji) => {
    const message = messages.find(m => m.id === messageId);
    if (!message) return;

    const pseudoAffiche = pseudo; 
    const existing = message.reactions?.find(r => r.username === pseudoAffiche && r.emoji === emoji);
    
    if (existing) {
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, reactions: m.reactions.filter(r => r.id !== existing.id) } : m));
      await supabase.from("reactions").delete().eq("id", existing.id);
    } else {
      const fakeReaction = { id: Date.now(), message_id: messageId, username: pseudo, emoji };
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, reactions: [...(m.reactions || []), fakeReaction] } : m));
      await supabase.from("reactions").insert([{ message_id: messageId, username: pseudo, emoji }]);
    }
  };

  const ouvrirGif = async () => {
    setGifOuvert(v => !v);
    if (gifTendances.length === 0) {
      setGifChargement(true);
      const res = await fetch(`https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_KEY}&limit=24&rating=g`);
      setGifTendances((await res.json()).data || []);
      setGifChargement(false);
    }
  };
  
  const rechercherGifs = async (query) => {
    setGifQuery(query);
    if (!query.trim()) { setGifResultats([]); return; }
    setGifChargement(true);
    const res = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_KEY}&q=${encodeURIComponent(query)}&limit=24&rating=g`);
    setGifResultats((await res.json()).data || []);
    setGifChargement(false);
  };
  
  const envoyerGif = async (gif) => {
    if (estMuet) {
  ajouterToast("Vous êtes muet sur ce serveur.", "error");
  return;
}
    if (!estModerateur && channelActuel?.slowmode_delay > 0) {
      const tempsEcoule = (Date.now() - dernierMessageTempsRef.current) / 1000;
      const tempsRestant = channelActuel.slowmode_delay - tempsEcoule;

      if (tempsRestant > 0) {
        ajouterToast(`Mode lent actif. Attendez encore ${Math.ceil(tempsRestant)}s`, "warning");
        return; 
      }
    }

    const url = gif.images.original.url;
    setGifOuvert(false);
    await supabase.from('messages').insert([{ 
      content: '', 
      username: pseudo, 
      room: `server-${server.id}-${channelActuel.id}`, 
      server_id: server.id, 
      channel_id: channelActuel.id, 
      image_url: url 
    }]);
    scrollBas();

    dernierMessageTempsRef.current = Date.now();
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


  useEffect(() => {
    const handleOpenSettings = () => {
      setOngletInitialSettings(estAdmin ? 'general' : 'membres');
      setSettingsOuvert(true);
    };
    window.addEventListener('open-server-settings', handleOpenSettings);
    return () => window.removeEventListener('open-server-settings', handleOpenSettings);
  }, [estAdmin]);

  const dernierEnvoiRef = useRef(0);
  const envoyerMessage = async () => {
    if (estMuet) {
      ajouterToast("Vous êtes muet sur ce serveur.", "error");
      return;
    }
    if (!estModerateur && channelActuel?.slowmode_delay > 0) {
      const tempsEcoule = (Date.now() - dernierMessageTempsRef.current) / 1000;
      const tempsRestant = channelActuel.slowmode_delay - tempsEcoule;

      if (tempsRestant > 0) {
        ajouterToast(`Mode lent actif. Attendez encore ${Math.ceil(tempsRestant)}s`, "warning");
        return;
      }
    }

    if (fichierPreview) { await confirmerEnvoiFichier(); return; }
    if (!nouveauMessage.trim() || !channelActuel) return;

    const regexMention = /@(\w+)/g;
    const mentionsTrouvees = [...nouveauMessage.matchAll(regexMention)].map(m => m[1]);

    const texte = nouveauMessage;
    setNouveauMessage(''); setReponseA(null);
    
    await supabase.from('messages').insert([{ 
      content: texte, 
      username: pseudo, 
      room: `server-${server.id}-${channelActuel.id}`, 
      server_id: server.id, 
      channel_id: channelActuel.id,
      reply_to_id: reponseA?.id || null,
      mentions: mentionsTrouvees
    }]);
    scrollBas();

    dernierMessageTempsRef.current = Date.now();
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

  const confirmerEnvoiFichier = async () => {
    if (estMuet) {
  ajouterToast("Vous êtes muet sur ce serveur.", "error");
  return;
}
    if (!fichierPreview || !channelActuel) return;

    if (!estModerateur && channelActuel?.slowmode_delay > 0) {
      const tempsEcoule = (Date.now() - dernierMessageTempsRef.current) / 1000;
      const tempsRestant = channelActuel.slowmode_delay - tempsEcoule;

      if (tempsRestant > 0) {
        ajouterToast(`Mode lent actif. Attendez encore ${Math.ceil(tempsRestant)}s`, "warning");
        return; 
      }
    }

    setIsUploading(true);
    const { file, type } = fichierPreview;
    const ext = file.name.split('.').pop().toLowerCase();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;
    const bucket = type.startsWith('image/') ? 'chat-images' : 'chat-files';
    const { error } = await supabase.storage.from(bucket).upload(`server-${server.id}/${fileName}`, file);
    
    if (error) { ajouterToast('Erreur upload : ' + error.message, 'error'); setIsUploading(false); return; }
    
    const texte = nouveauMessage;
    const reponse = reponseA?.id || null;
    setNouveauMessage(''); setReponseA(null);

    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(`server-${server.id}/${fileName}`);
    await supabase.from('messages').insert([{ 
      content: texte, 
      username: pseudo, 
      room: `server-${server.id}-${channelActuel.id}`, 
      server_id: server.id, 
      channel_id: channelActuel.id, 
      image_url: publicUrl, 
      file_name: file.name, 
      file_type: type,
      reply_to_id: reponse
    }]);
    
    if (fichierPreview.url) {
      URL.revokeObjectURL(fichierPreview.url);
    }
    
    setIsUploading(false);
    setFichierPreview(null);
    scrollBas();

    dernierMessageTempsRef.current = Date.now();
  };

  const supprimerMessage = async (id) => {
    const el = messagesRefsMap.current[id];
    if (el) {
      el.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      el.style.opacity = '0';
      el.style.transform = 'scale(0.95)';
    }

    setTimeout(async () => {
      const { data, error } = await supabase
        .from('messages')
        .delete()
        .eq('id', id)
        .select(); 

      if (error || !data || data.length === 0) {
        if (el) { 
          el.style.opacity = '1'; 
          el.style.transform = 'scale(1)'; 
        } 
        ajouterToast("Refusé : Vous n'avez pas l'autorisation de supprimer ceci.", 'error');
      } else {
        await supabase.from('server_logs').insert({
          server_id: server.id,
          actor_id: session.user.id,
          action_type: 'delete_message',
          details: `A supprimé un message dans #${channelActuel.name}`
        });
      }
    }, 300);
  };

  const togglePin = async (messageId, estEpingeleactuellement) => {
    const { data, error } = await supabase
      .from('messages')
      .update({ pinned: !estEpingeleactuellement })
      .eq('id', messageId)
      .select();

    if (error) {
      ajouterToast(`Erreur : ${error.message}`, "error");
    } else if (!data || data.length === 0) {
      ajouterToast("Refusé : Vérifiez vos règles de sécurité RLS.", "error");
    } else {
      ajouterToast(estEpingeleactuellement ? "Message désépinglé" : "Message épinglé !");
    }
  };

  const sauvegarderEdition = async (id) => {
    if (!texteEdition.trim()) return;
    
    const { error } = await supabase
      .from('messages')
      .update({ 
        content: texteEdition, 
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
      
    if (error) {
      ajouterToast(`Erreur modification : ${error.message}`, "error");
    } else {
      setMessageEnEdition(null);
    }
  };

  


  const RenduMessage = ({ content, monPseudo, isMyMsg = false }) => {
    if (!content) return null;
    const parts = content.split(/(@\w+)/g);
    const hasMention = parts.some(p => p.startsWith('@'));
    if (!hasMention) {
      return (
        <ReactMarkdown components={{
          p: ({node, ...props}) => <p className="mb-1 last:mb-0" {...props} />,
          a: ({node, ...props}) => <a className="underline hover:opacity-80" target="_blank" rel="noopener noreferrer" {...props} />,
          strong: ({node, ...props}) => <strong className="font-extrabold" {...props} />,
          em: ({node, ...props}) => <em className="italic" {...props} />,
          code: ({node, inline, ...props}) => inline ? <code className="bg-black/20 rounded px-1.5 py-0.5 text-sm font-mono" {...props} /> : <pre className="bg-black/30 p-2 rounded-lg my-1 overflow-x-auto"><code className="text-sm font-mono" {...props} /></pre>,
          blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-current pl-3 opacity-80 italic my-2" {...props} />,
        }}>{content}</ReactMarkdown>
      );
    }
    return (
      <p className="text-[15px] break-words">
        {parts.map((part, i) => {
          if (!part.startsWith('@')) return <span key={i}>{part}</span>;
          const mentionned = part.slice(1);
          const estMoi = mentionned === monPseudo;
          return (
            <span 
              key={i} 
              className={`font-black rounded px-1 py-0.5 transition-colors ${
                estMoi 
                  ? 'bg-warning/40 text-warning-content ring-1 ring-warning/50' 
                  : isMyMsg 
                  ? 'bg-white/20 text-white shadow-sm' 
                  : 'text-primary bg-primary/10 hover:bg-primary/20'
              }`}
            >
              <span className="opacity-70 font-medium">@</span>
              <span className="font-black">{mentionned}</span>
            </span>
          );
        })}
      </p>
    );
  };

  const salonsVisibles = channels.filter(ch => {
    if (!ch.allowed_roles || ch.allowed_roles.length === 0) return true;
    return ch.allowed_roles.includes(monRole);
  });

  const muterUtilisateur = async (usernameTarget, minutes) => {
    const dateFin = new Date(Date.now() + minutes * 60000).toISOString();
    
    const { error } = await supabase.from('server_members').update({ muted_until: dateFin }).eq('server_id', server.id).eq('pseudo', usernameTarget);

    if (!error) {
      ajouterToast(`${usernameTarget} rendu muet pour ${minutes} min.`, "success");
      await supabase.from('server_logs').insert({
        server_id: server.id,
        actor_id: session?.user?.id, 
        action_type: 'update_server',
        details: `A rendu muet ${usernameTarget} pour ${minutes} minutes`
      });
    } else {
      ajouterToast("Erreur lors de la sanction", "error");
    }
  };

  const bannirUtilisateur = async (userIdCible, usernameCible) => {
    await supabase.from('server_bans').insert({
      server_id: server.id,
      user_id: userIdCible
    });

    const { error } = await supabase.from('server_members').delete()
      .eq('server_id', server.id)
      .eq('user_id', userIdCible);

    if (!error) {
      ajouterToast(`${usernameCible} a été banni définitivement.`, "success");
      await supabase.from('server_logs').insert({
        server_id: server.id, actor_id: session?.user?.id, action_type: 'ban_user', details: `A banni ${usernameCible}`
      });
    } else {
      ajouterToast("Erreur lors du bannissement", "error");
    }
  };

  const handleUserClick = (e, usernameCible) => {
    onUserClick(e, usernameCible, {
      estModerateur,
      muterUtilisateur: (minutes) => muterUtilisateur(usernameCible, minutes),
      bannirUtilisateur: (userIdCible) => bannirUtilisateur(userIdCible, usernameCible)
    });
  };

  useLayoutEffect(() => {
    if (!chargement && messages.length > 0 && conteneurRef.current) {
      conteneurRef.current.scrollTop = conteneurRef.current.scrollHeight;
    }
  }, [chargement, channelActuel?.id]);

  useEffect(() => {
    if (estModerateur || !channelActuel?.slowmode_delay) {
      setTempsRestantSlowmode(0);
      return;
    }

    const verifierTemps = () => {
      const tempsEcoule = (Date.now() - dernierMessageTempsRef.current) / 1000;
      const restant = Math.ceil(channelActuel.slowmode_delay - tempsEcoule);
      setTempsRestantSlowmode(restant > 0 ? restant : 0);
    };

    verifierTemps();
    const interval = setInterval(verifierTemps, 1000);

    return () => clearInterval(interval);
  }, [channelActuel?.id, channelActuel?.slowmode_delay, estModerateur]);

  useEffect(() => {
    const fetchMuteStatus = async () => {
      const { data } = await supabase.from('server_members').select('muted_until').eq('server_id', server.id).eq('pseudo', pseudo).maybeSingle();
      if (data) setMutedUntil(data.muted_until);
    };
    if (server?.id && pseudo) fetchMuteStatus();

    const channel = supabase.channel(`mute_listener_${server.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'server_members', filter: `server_id=eq.${server.id}` }, (payload) => {
        if (payload.new.pseudo === pseudo) {
          setMutedUntil(payload.new.muted_until);
          if (payload.new.muted_until && new Date(payload.new.muted_until) > new Date()) {
            ajouterToast("Vous avez été rendu muet par un modérateur.", "error");
          }
        }
      }).subscribe();

    return () => supabase.removeChannel(channel);
  }, [server?.id, pseudo]);

  return (
    <div className="flex flex-1 overflow-hidden relative bg-base-100">
      <style>{`
        @keyframes toastIn { from{opacity:0;transform:translateX(16px) scale(0.95)} to{opacity:1;transform:translateX(0) scale(1)} }
        @keyframes menuAppear { from{opacity:0;transform:scale(0.92) translateY(-6px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes menuDisappear { from{opacity:1;transform:scale(1) translateY(0)} to{opacity:0;transform:scale(0.92) translateY(-6px)} }
        .menu-contextuel-enter { animation: menuAppear 0.15s cubic-bezier(0.34,1.56,0.64,1) forwards; transform-origin: top left; }
        .menu-contextuel-exit { animation: menuDisappear 0.12s ease-in forwards; transform-origin: top left; }
        @keyframes emojiPop { 0% {opacity:0;transform:scale(0.5) translateY(4px)} 70% {transform:scale(1.15) translateY(-2px)} 100% {opacity:1;transform:scale(1) translateY(0)} }
        .emoji-btn { animation: emojiPop 0.2s ease forwards; }
        @keyframes formatPopIn { 0% {opacity:0; transform:scale(0.9) translateY(4px)} 100% {opacity:1; transform:scale(1) translateY(0)} }
        @keyframes formatPopOut { 0% {opacity:1; transform:scale(1) translateY(0)} 100% {opacity:0; transform:scale(0.9) translateY(4px)} }
        .format-enter { animation: formatPopIn 0.15s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; transform-origin: bottom left; }
        .format-exit { animation: formatPopOut 0.15s ease-in forwards; transform-origin: bottom left; }
      `}</style>
      
      <div className="w-56 bg-base-200 flex flex-col flex-shrink-0 border-r border-base-300">
        
        <div className="h-12 px-3 border-b border-base-300 flex items-center justify-between bg-base-200 hover:bg-base-300 transition-colors cursor-pointer" 
             onClick={() => { 
               setOngletInitialSettings(estAdmin ? 'general' : 'membres'); 
               setSettingsOuvert(true); 
             }}>
          <h2 className="font-bold text-sm truncate flex-1">{server.name}</h2>
          <Settings size={14} className="text-gray-400" />
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 mb-1 mt-2">Salons textuels</div>
        {salonsVisibles.map((ch) => {
          const notifCount = notifications?.[`server-${server.id}-${ch.id}`] || 0;
          const hasNotif = notifCount > 0 && channelActuel?.id !== ch.id;

          return (
            <button
              key={ch.id}
              onClick={() => setChannelActuel(ch)}
              className={`group relative flex items-center justify-between w-full px-2 py-1.5 rounded-lg transition-all ${
                channelActuel?.id === ch.id 
                  ? 'bg-primary/20 text-primary' 
                  : hasNotif
                  ? 'text-base-content font-bold' 
                  : 'text-gray-400 hover:bg-base-300 hover:text-base-content'
              }`}
            >
              {hasNotif && (
                <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-2 bg-white rounded-r-full shadow-[0_0_8px_rgba(255,255,255,255] animate-[toastIn_0.2s_ease_forwards]" />
              )}

              <div className="flex items-center gap-2 font-medium truncate ml-1">
                <Hash 
                  size={18} 
                  className={channelActuel?.id === ch.id ? "text-primary" : hasNotif ? "text-base-content opacity-100" : "opacity-40"} 
                />
                <span className="truncate">{ch.name}</span>
              </div>
              
              <div className="flex items-center shrink-0">
                {ch.allowed_roles && (
                  <Shield size={12} className="opacity-0 group-hover:opacity-40 transition-opacity" />
                )}
              </div>
            </button>
          );
        })}
          {estAdmin && (
            <button onClick={() => { setOngletInitialSettings('channels'); setSettingsOuvert(true); }} 
                    className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-sm text-gray-400 hover:text-success hover:bg-base-300/50 transition-colors mt-1">
              <Plus size={16}/><span className="cursor-pointer">Ajouter un salon</span>
            </button>
          )}
        </div>

        <div className="p-3 border-t border-base-300 bg-base-200 flex items-center gap-2 mt-auto w-full">
          <div className="flex items-center gap-2 flex-1 min-w-0 rounded-lg px-2 py-1.5 group">
            <div 
              className="relative flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity z-50" 
              ref={menuStatutRef}
              onClick={() => setMenuStatutOuvert(!menuStatutOuvert)}
            >
              <img src={getAvatarUrl(pseudo)} alt="Moi" className="w-8 h-8 rounded-full object-cover" />
              {monProfil?.statut !== 'invisible' && (
                <span className={`w-2.5 h-2.5 absolute -bottom-0.5 -right-0.5 border-2 border-base-200 rounded-full flex-shrink-0 ${
                  monProfil?.statut === 'en_ligne' ? 'bg-success' : 
                  monProfil?.statut === 'occupe' ? 'bg-warning' : 
                  monProfil?.statut === 'absent' ? 'bg-error' : 'bg-gray-400'
                }`} />
              )}

              {menuStatutOuvert && (
                <div className="absolute bottom-full left-0 mb-3 w-48 bg-base-100 border border-base-300 rounded-xl shadow-[0_15px_40px_-10px_rgba(0,0,0,0.3)] p-1.5 z-[100] animate-[modalIn_0.15s_ease_forwards] origin-bottom-left cursor-default" onClick={e => e.stopPropagation()}>
                  <div className="px-2 py-1.5 mb-1 text-[10px] font-black uppercase tracking-widest text-gray-500 border-b border-base-200">
                    Définir un statut
                  </div>
                  {Object.entries(STATUTS).map(([key, data]) => (
                    <button
                      key={key}
                      onClick={() => changerStatut(key)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-bold transition-all hover:bg-base-200/60 hover:pl-4 ${monProfil?.statut === key ? 'bg-primary/10 text-primary' : 'text-base-content'}`}
                    >
                      <span className={`w-3 h-3 rounded-full border border-base-100 ${data.dot}`}></span>
                      <span>{data.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="min-w-0 text-left flex-1">
              <div className="text-sm font-bold truncate">{monProfil?.pseudo || pseudo}</div>
              <div className={`text-[10px] font-medium ${
                monProfil?.statut === 'en_ligne' ? 'text-success' : 
                monProfil?.statut === 'occupe' ? 'text-warning' : 
                monProfil?.statut === 'absent' ? 'text-error' : 'text-gray-400'
              }`}>
                {monProfil?.statut === 'en_ligne' ? 'En ligne' : 
                 monProfil?.statut === 'occupe' ? 'Occupé' : 
                 monProfil?.statut === 'absent' ? 'Absent' : 'Invisible'}
              </div>
            </div>
            <button onClick={onOpenParametres} className="flex-shrink-0 p-1.5 rounded-md text-gray-400 hover:text-base-content hover:bg-base-300 transition-colors cursor-pointer" title="Paramètres">
              <Settings size={16} />
            </button>
          </div>
          <button onClick={onLogout} className="btn btn-ghost btn-sm btn-circle text-error opacity-60 hover:opacity-100 flex-shrink-0" title="Se déconnecter">
            <LogOut size={15} />
          </button>
        </div>
        </div>
        

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="h-12 border-b border-base-200 flex items-center px-4 gap-2 flex-shrink-0 bg-base-100 shadow-sm z-10">
          
          <button className="md:hidden btn btn-ghost btn-sm btn-circle mr-1" onClick={toggleMenuMobile}>
            <Menu size={20} />
          </button>

          <Hash size={20} className="text-gray-400" />
          <span className="font-bold">{channelActuel?.name || 'Accueil du serveur'}</span>
          <div className="flex-1" />
        
          <button 
            onClick={() => { setEpinglesPanel(!epinglesPanel); setMembresPanel(false); }} 
            className={`btn btn-ghost btn-sm btn-circle ${epinglesPanel ? 'text-warning bg-warning/10' : 'text-gray-400 hover:text-warning'}`} 
            title="Messages épinglés">
            <Pin size={18}/>
          </button>

          <button 
            onClick={() => { setMembresPanel(!membresPanel); setEpinglesPanel(false); }} 
            className={`btn btn-ghost btn-sm btn-circle ${membresPanel ? 'text-primary bg-primary/10' : 'text-gray-400 hover:text-primary'}`} 
            title="Liste des membres">
            <Users size={18}/>
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {channelActuel ? (
            <div className="flex-1 flex flex-col overflow-hidden">
                          

            <div ref={conteneurRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 relative">
              {hasNewMessagesBelow && (
                <div className="sticky top-0 z-20 flex justify-center w-full pointer-events-none animate-bounce">
                  <button 
                    onClick={() => scrollBas(true)} 
                    className="pointer-events-auto bg-primary text-primary-content px-4 py-1.5 rounded-full shadow-lg text-xs font-bold flex items-center gap-2 hover:scale-105 transition-transform"
                  >
                    <ArrowDown size={14} /> Nouveaux messages reçus
                  </button>
                </div>
              )}
              {chargement && messages.length === 0 ? (
                Array(6).fill(0).map((_, i) => <MessageSkeleton key={i} />)
              ) : (
                <>
                  <div className="flex items-center gap-3 my-2 px-2">
                    <div className="flex-1 h-px bg-base-300"></div>
                    <span className="text-[11px] text-gray-400 whitespace-nowrap">Début de l'historique de #{channelActuel?.name}</span>
                    <div className="flex-1 h-px bg-base-300"></div>
                  </div>

                  {messages.map((msg, index) => {
                    const messagePrecedent = index > 0 ? messages[index - 1] : null;
                    const messageParent = msg.reply_to_id ? messages.find(m => m.id === msg.reply_to_id) : null;
                    
                    let auteurTech = msg.username;
                    Object.keys(profilsCache || {}).forEach(k => { if(profilsCache?.[k]?.pseudo === msg.username) auteurTech = k; });
                    const statutAuteur = profilsCache ? getStatutEffectif(auteurTech, profilsCache[auteurTech]) : null;

                    return (
                      <MessageItem
                        key={msg.id}
                        msg={msg}
                        messagePrecedent={messagePrecedent}
                        messageParent={messageParent}
                        monPseudoAffiche={pseudo}
                        statutAuteur={statutAuteur}
                        getAvatarUrlForDisplay={getAvatarUrl}
                        messagesRefsMap={messagesRefsMap}
                        messageEnEdition={messageEnEdition}
                        texteEdition={texteEdition}
                        setTexteEdition={setTexteEdition}
                        sauvegarderModification={sauvegarderEdition}
                        setMessageEnEdition={setMessageEnEdition}
                        ouvrirMenuContextuel={ouvrirMenuContextuel}
                        gererClicProfil={handleUserClick}
                        allerAuMessage={allerAuMessage}
                        salonActuel={`server-${server.id}-${channelActuel.id}`}
                        toggleReaction={toggleReaction}
                      />
                    );
                  })}
                </>
              )}
            </div>
            
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
              tempsRestantSlowmode={tempsRestantSlowmode}
              estMuet={estMuet}
              mutedUntil={mutedUntil}

              placeholder={`Écrire dans #${channelActuel?.name}...`}
              pseudoActuel={pseudo}

              mentionMenuOuvert={mentionMenu.ouvert}
              mentionsFiltrees={membresFiltres.map(m => ({ pseudo: m.pseudo, avatar_url: getAvatarUrl(m.pseudo) }))}
              mentionIndex={mentionIndex}
              setMentionIndex={setMentionIndex}
              fermerMenuMention={() => setMentionMenu({ ouvert: false, recherche: '', index: -1 })}
              insererMention={insererMention}

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
              inputRef={inputRef}
            />
          </div>
          ) : !channelsLoaded ? (
            <div className="flex-1 flex flex-col items-center justify-center bg-base-100">
              <Loader2 size={40} className="animate-spin text-primary opacity-50" />
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center bg-base-100 text-center px-4 animate-fade-in">
              <div className="w-24 h-24 bg-base-200 rounded-full flex items-center justify-center mb-6 shadow-inner">
                <Hash size={48} className="text-gray-400 opacity-50" />
              </div>
              <h3 className="text-2xl font-black text-base-content mb-2">C'est un peu vide par ici...</h3>
              <p className="text-gray-500 max-w-md">Il n'y a aucun salon textuel. Créez des salons pour pouvoir discuter avec votre communauté !</p>
            </div>
          )}

          {membresPanel && (
            <PanneauMembres
              membres={membres}
              getAvatarUrl={getAvatarUrl}
              onUserClick={handleUserClick}
              profilsCache={profilsCache}
              getStatutEffectif={getStatutEffectif}
            />
          )}
          <PanneauEpingles
            epinglesPanel={epinglesPanel}
            setEpinglesPanel={setEpinglesPanel}
            messages={messagesEpingles}
            getAvatarUrl={getAvatarUrl}
            allerAuMessage={allerAuMessage}
            salonActuel={`server-${server.id}-${channelActuel?.id}`}
            togglePin={togglePin}
            estModerateur={estModerateur}
            pseudo={pseudo}
          />
        </div>
      </div>
      
      {settingsOuvert && (
        <ServerSettings 
          server={server} monRole={monRole} session={session} monProfil={monProfil} demanderConfirmation={demanderConfirmation}
          initialTab={ongletInitialSettings}
          onClose={() => setSettingsOuvert(false)} onServerDeleted={onLeave}
          onServerUpdated={(updated) => setServer(updated)} ajouterToast={ajouterToast} />
      )}

      {menuContextuel && (
        <div className={`fixed z-[70] bg-base-100 rounded-xl shadow-2xl border border-base-200 py-2 w-52 text-sm overflow-hidden ${menuFermeture ? 'menu-contextuel-exit' : 'menu-contextuel-enter'}`}
          style={{ top: menuContextuel.y, left: menuContextuel.x }}>
          <div className="px-3 pb-2 mb-1 border-b border-base-200 font-bold text-xs text-gray-400 truncate uppercase tracking-wider">{menuContextuel.message.username}</div>
          
          <div className="flex items-center justify-around px-3 py-2 mb-1 border-b border-base-200">
            {emojisDispos.map((emoji, i) => {
              const live = messages.find(m => m.id === menuContextuel.message.id);
              const dejaReagi = live?.reactions?.some(r => r.username === pseudo && r.emoji === emoji);
              return (
                <button key={emoji} className={`emoji-btn text-xl transition-all duration-100 hover:scale-125 active:scale-95 rounded-lg p-1 ${dejaReagi ? 'bg-primary/15 ring-1 ring-primary/40' : 'hover:bg-base-200'}`}
                  style={{ animationDelay: `${i * 30}ms`, opacity: 0 }}
                  onClick={() => { toggleReaction(menuContextuel.message.id, emoji); fermerMenuContextuel(); }}>{emoji}</button>
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

  {estModerateur && (
    <li>
      <a onClick={() => { togglePin(menuContextuel.message.id, menuContextuel.message.pinned); fermerMenuContextuel(); }}>
        <Pin size={16} className={menuContextuel.message.pinned ? "text-warning" : ""} /> 
        {menuContextuel.message.pinned ? 'Désépingler' : 'Épingler'}
      </a>
    </li>
  )}
  {(menuContextuel.message.username === pseudo || estModerateur) && (<>
    {menuContextuel.message.username === pseudo && <li><a onClick={() => { setMessageEnEdition(menuContextuel.message.id); setTexteEdition(menuContextuel.message.content); fermerMenuContextuel(); }}><Pencil size={16} /> Modifier</a></li>}
    <li><a className="text-error hover:bg-error/10 hover:text-error" onClick={() => { supprimerMessage(menuContextuel.message.id); fermerMenuContextuel(); }}><Trash size={16} /> Supprimer</a></li>
  </>)}
</ul>
        </div>
      )}
    </div>
  );
}