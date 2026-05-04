import { useState } from 'react';


export const LISTE_COMMANDES = [
  { nom: '/shrug', description: 'Ajoute ¯\\_(ツ)_/¯ à la fin' },
  { nom: '/roll', description: 'Lance un dé (ex: /roll 20)' },
  { nom: '/flip', description: 'Lance une pièce (Pile ou Face)' },
  { nom: '/8ball', description: 'Pose une question à la boule magique' },
  { nom: '/me', description: 'Fait une action à la 3ème personne' },
  { nom: '/spoiler', description: 'Masque le texte avec une balise spoiler' },
  { nom: '/calc', description: 'Calculatrice simple (ex: /calc 2+2)' }
];

export function useCommandes() {
  const [commandeQuery, setCommandeQuery] = useState(null);
  const [commandeIndex, setCommandeIndex] = useState(0);

  const traiterCommande = (messageATraiter, ajouterToast) => {
    let texteFinal = messageATraiter;

    if (texteFinal.startsWith('/')) {
      const args = texteFinal.split(' ');
      const commande = args[0].toLowerCase();
      const resteDuTexte = args.slice(1).join(' ');

      switch (commande) {
        case '/shrug':
          texteFinal = resteDuTexte ? `${resteDuTexte} ¯\\_(ツ)_/¯` : '¯\\_(ツ)_/¯';
          break;
        case '/roll':
          const max = parseInt(args[1]) || 100;
          const resultatRoll = Math.floor(Math.random() * max) + 1;
          texteFinal = `🎲 *A lancé un dé (1-${max}) et a obtenu :* **${resultatRoll}**`;
          break;
        case '/flip':
          const resultatFlip = Math.random() < 0.5 ? 'Pile' : 'Face';
          texteFinal = `🪙 *A lancé une pièce et a obtenu :* **${resultatFlip}**`;
          break;
        case '/8ball':
          if (!resteDuTexte) {
            ajouterToast("Posez une question : /8ball Vais-je devenir riche ?", "info");
            return null;
          }
          const reponses = [
            "C'est certain.", "Sans aucun doute.", "Oui, absolument.", "Tu peux y compter.",
            "Très probablement.", "Les signes pointent vers oui.", "Essaye plus tard.",
            "Mieux vaut ne pas te le dire maintenant.", "Concentre-toi et redemande.",
            "N'y compte pas.", "Ma réponse est non.", "Très douteux."
          ];
          const reponseAleatoire = reponses[Math.floor(Math.random() * reponses.length)];
          texteFinal = `🎱 *Demande à la boule magique :* "${resteDuTexte}"\n> **${reponseAleatoire}**`;
          break;

          case '/me':
          if (!resteDuTexte) {
            ajouterToast("Précisez une action : /me boit un café", "info");
            return null;
          }
          texteFinal = `_${resteDuTexte}_`;
          break;

        case '/spoiler':
          if (!resteDuTexte) {
            ajouterToast("Précisez un texte à cacher : /spoiler mon secret", "info");
            return null;
          }
          texteFinal = `||${resteDuTexte}||`;
          break;

        case '/calc':
          if (!resteDuTexte) {
            ajouterToast("Entrez un calcul : /calc 5 * 5", "info");
            return null;
          }
          try {
            if (!/^[0-9+\-*/().\s]+$/.test(resteDuTexte)) {
              ajouterToast("Calcul invalide. Utilisez uniquement des chiffres et +, -, *, /", "error");
              return null;
            }
            
            const resultatCalc = new Function('return ' + resteDuTexte)();
            
            const resultatFormate = Number.isInteger(resultatCalc) ? resultatCalc : Number(resultatCalc).toFixed(2);
            
            texteFinal = `🧮 **Calcul :** ${resteDuTexte} = **${resultatFormate}**`;
          } catch (e) {
            ajouterToast("Calcul impossible (erreur de syntaxe).", "error");
            return null;
          }
          break;
      }
    }
    
    return texteFinal;
  };

  const gererFrappeCommande = (val) => {
    if (val.startsWith('/') && !val.includes(' ')) {
      setCommandeQuery(val.slice(1).toLowerCase());
      setCommandeIndex(0);
    } else {
      setCommandeQuery(null);
    }
  };

  const reinitialiserMenuCommande = () => {
    setCommandeQuery(null);
  };

  return {
    commandeQuery,
    commandeIndex,
    setCommandeIndex,
    traiterCommande,
    gererFrappeCommande,
    reinitialiserMenuCommande
  };
}