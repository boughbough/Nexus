<div align="center">

  <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Hand gestures/Eye.png" alt="Fox" width="70" />
  <h1>N E X U S</h1>
  
  <p><b>L'instinct de la communication. 
    <br />Simple . Fluide . Sécurisé . </b></p>

  <p>
    <a href="#"><img src="https://img.shields.io/badge/Statut-En_Ligne-2EA043?style=for-the-badge" alt="Statut En Ligne" /></a>
    <a href="#"><img src="https://img.shields.io/badge/Déployé_sur-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel Status" /></a>
    <a href="https://nexus-dusky-alpha.vercel.app"><img src="https://img.shields.io/badge/🔥_Démo_Live-Lancer_Nexus-FF4500?style=for-the-badge" alt="Live Demo" /></a>
    <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/Licence-MIT-1A1A1A?style=for-the-badge&logo=github&logoColor=white" alt="License: MIT" /></a>
  </p>

  <br />

  <a href="https://nexus-dusky-alpha.vercel.app" target="_blank">
    <img src="./screens/landing.png" alt="Nexus Banner" width="100%" />
  </a>

  <br /><br />

  <h2><a href="https://nexus-dusky-alpha.vercel.app"> Essayer maintenant</a></h2>
  <br />

  <p><i>Propulsé par les meilleures technologies web</i></p>

  <p>
    <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
    <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="TailwindCSS" />
    <img src="https://img.shields.io/badge/Supabase-1C1C1C?style=for-the-badge&logo=supabase&logoColor=3ECF8E" alt="Supabase" />
    <img src="https://img.shields.io/badge/hCaptcha-003366?style=for-the-badge&logo=hcaptcha&logoColor=white" alt="hCaptcha" />
  </p>

  <hr />
</div>

<br />

> **Nexus** est une plateforme de messagerie instantanée moderne, fluide et hautement sécurisée. Conçue pour offrir une alternative élégante et rapide aux outils de communication actuels, elle combine la puissance de React et de Supabase pour une expérience utilisateur sans compromis.

---

## ✨ Fonctionnalités Clés

### 💬 Communication & Social
- **Real-time Messaging** : Discussion instantanée avec mise à jour en direct via Supabase Realtime.
- **Gestion de Serveurs** : Créez vos propres espaces et organisez-les avec des salons thématiques.
- **Partage Multimédia** : Envoi d'images, intégration de GIFs via Giphy et gestion d'avatars personnalisés.
- **Quick Switcher** : Navigation ultra-rapide entre les serveurs et les messages privés.

### 🛡️ Sécurité & Protection
- **Authentification Sécurisée** : Système robuste géré par Supabase Auth.
- **Protection Anti-Bots** : Intégration complète de **hCaptcha** sur les flux de connexion et d'inscription.
- **Force du Mot de Passe** : Validation dynamique (8+ caractères, majuscules, chiffres, caractères spéciaux).
- **Zone de Danger** : Possibilité pour l'utilisateur de supprimer son compte et toutes ses données définitivement.

### 🎨 Design & Personnalisation
- **Multi-Thèmes** : Choisissez votre ambiance (Dark, Light, Cyberpunk, etc.) grâce à DaisyUI.
- **Interface Adaptive** : Entièrement responsive, de l'ordinateur de bureau au smartphone.
- **Micro-interactions** : Animations fluides et toasts de notification pour une UX premium.

---

## 📸 Aperçu de l'Interface (Démos)

| Connexion Sécurisée (hCaptcha) | Messagerie en Temps Réel |
| :--- | :--- |
| ![Démo Connexion](./screens/login.gif) | ![Démo Chat Live](./screens/chat-live.gif) |

| Paramètres | Navigation Rapide (Quick Switcher) |
| :--- | :--- |
| ![Démo Paramètres](./screens/settings.gif) | ![Démo Switcher](./screens/quick-switcher.gif) |

---

## 🚀 Technologies Utilisées

| Secteur | Technologie |
| :--- | :--- |
| **Frontend** | [React.js](https://reactjs.org/) + [Vite](https://vitejs.dev/) |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) + [DaisyUI](https://daisyui.com/) |
| **Backend / DB** | [Supabase](https://supabase.com/) (PostgreSQL & Realtime) |
| **Sécurité** | [hCaptcha](https://www.hcaptcha.com/) |
| **Icônes** | [Lucide React](https://lucide.dev/) |
| **Déploiement** | [Vercel](https://vercel.com/) |

---

## 🛠️ Installation et Lancement

### 1. Pré-requis
Assurez-vous d'avoir [Node.js](https://nodejs.org/) installé sur votre machine.

### 2. Clonage et Dépendances
```bash
git clone https://github.com/votre-pseudo/nexus.git
cd nexus
npm install
```

### 3. Configuration des Variables d'Environnement
Créez un fichier `.env` à la racine du projet et ajoutez vos clés :
```env
VITE_SUPABASE_URL=votre_url_supabase
VITE_SUPABASE_ANON_KEY=votre_cle_anon
VITE_GIPHY_KEY=votre_cle_giphy
VITE_HCAPTCHA_SITE_KEY=votre_cle_publique_hcaptcha
```

### 4. Démarrage
Lancez le serveur de développement local :
```bash
npm run dev
```

---

## 📝 Licence

Ce projet est sous licence MIT. Libre à vous de l'utiliser et de le modifier.

---

