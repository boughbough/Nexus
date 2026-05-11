import React, { useState } from 'react';
import ThemeDropdown from './ThemeDropdown';
import { ArrowLeft } from 'lucide-react';
import HCaptcha from '@hcaptcha/react-hcaptcha';

export default function LandingPage({
  isTransitioningAuth,
  showAuthForm,
  basculerVersAccueil,
  basculerVersFormulaire,
  isLogin,
  authError,
  email,
  setEmail,
  password,
  setPassword,
  seConnecter,
  sInscrire
}) {
  const [captchaToken, setCaptchaToken] = useState(null);

  const isLengthValid = password.length >= 8;
  const hasUpperAndLower = /[a-z]/.test(password) && /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  
  const isPasswordValid = isLengthValid && hasUpperAndLower && hasNumber && hasSpecial;

  const canSubmitSignup = isPasswordValid && captchaToken;
  const canSubmitLogin = !!captchaToken; 

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isLogin && !canSubmitSignup) return; 
    if (isLogin && !canSubmitLogin) return;
    
    if (isLogin) {
      seConnecter(e, captchaToken);
    } else {
      sInscrire(e, captchaToken);
    }
  };

  return (
    <div className="relative h-screen w-full bg-base-200 overflow-hidden" style={{ fontFamily: "'system-ui', sans-serif" }}>
      <div className="absolute top-4 right-4 z-[100]">
        <ThemeDropdown />
      </div>

      <style>{`
        @keyframes lp-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes lp-sway {
          0%, 100% { transform: rotate(-2deg); }
          50% { transform: rotate(2deg); }
        }
        @keyframes lp-fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes lp-foxReveal {
          0%   { opacity: 0; transform: scale(0.6) rotate(-12deg); filter: blur(6px); }
          60%  { opacity: 1; filter: blur(0); }
          100% { opacity: 1; transform: scale(1) rotate(0deg); filter: blur(0); }
        }
        @keyframes lp-haloReveal {
          0%   { opacity: 0; transform: scale(0.4); }
          100% { opacity: 1; transform: scale(1.1); }
        }
        @keyframes lp-blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(20px, -20px) scale(1.05); }
          66% { transform: translate(-15px, 15px) scale(0.95); }
        }
        .lp-fade-up { animation: lp-fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
        .lp-fade-up-d1 { animation-delay: 0.1s; }
        .lp-fade-up-d2 { animation-delay: 0.2s; }
        .lp-fade-up-d3 { animation-delay: 0.3s; }
        .lp-fade-up-d4 { animation-delay: 0.45s; }
        .lp-fade-up-d5 { animation-delay: 0.55s; }
        .lp-float { animation: lp-float 6s ease-in-out infinite; }
        .lp-sway { animation: lp-sway 7s ease-in-out infinite; transform-origin: center; }
        .lp-blob { animation: lp-blob 18s ease-in-out infinite; }
        .lp-slide { transition: transform 0.55s cubic-bezier(0.65, 0, 0.35, 1), opacity 0.4s ease; will-change: transform, opacity; }
        .lp-fox-reveal {
          opacity: 0;
          animation: lp-foxReveal 1.1s cubic-bezier(0.34, 1.4, 0.5, 1) 0.15s forwards;
        }
        .lp-halo-reveal {
          opacity: 0;
          animation: lp-haloReveal 1.4s ease-out 0.3s forwards;
        }
        .lp-arc-text {
          fill: currentColor;
          font-weight: 900;
          letter-spacing: 0.02em;
        }
      `}</style>

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[15%] left-[10%] w-72 h-72 bg-primary/10 rounded-full blur-3xl lp-blob" />
        <div className="absolute bottom-[10%] right-[5%] w-80 h-80 bg-primary/5 rounded-full blur-3xl lp-blob" style={{ animationDelay: '6s' }} />
      </div>

      <div className="absolute bottom-6 left-6 z-30 text-xs text-base-content/30 lp-fade-up lp-fade-up-d5">
        © {new Date().getFullYear()} Nexus | Tous droits réservés <br/> Mohamed Boughmadi 
      </div>

      <div
        className="absolute inset-0 flex w-[200%] lp-slide"
        style={{ transform: showAuthForm ? 'translateX(-50%)' : 'translateX(0%)' }}
      >


        <div className="w-1/2 h-full relative flex items-center justify-center">
          <div className="relative z-10 flex flex-col items-center text-center px-6">

            <div className="lp-fade-up text-base-content mb-2 md:mb-4">
              <svg
                viewBox="0 0 400 160"
                className="w-72 md:w-96 h-auto overflow-visible"
                aria-label="Nexus"
              >
                <defs>
                  <path
                    id="lp-arc-path"
                    d="M 30 140 A 240 240 0 0 1 370 140"
                    fill="transparent"
                  />
                </defs>
                <text
                  className="lp-arc-text"
                  fontSize="58"
                  textAnchor="middle"
                >
                  <textPath href="#lp-arc-path" startOffset="50%">
                    Nexus
                  </textPath>
                </text>
              </svg>
            </div>

            <div className="lp-float">
              <div className="lp-sway">
                <div className="lp-fox-reveal">
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary/15 blur-3xl lp-halo-reveal" />
                    <img
                      src="/logo.gif"
                      alt="Nexus"
                      className="relative w-40 h-40 md:w-52 md:h-52 object-contain"
                      draggable="false"
                    />
                  </div>
                </div>
              </div>
            </div>

            <h2 className="text-2xl md:text-3xl font-bold text-base-content leading-tight mb-3 lp-fade-up lp-fade-up-d2">
              Just talk.
            </h2>
            <p className="text-sm text-base-content/50 leading-relaxed max-w-md mb-8 lp-fade-up lp-fade-up-d3">
              Messages privés, serveurs communautaires, tout au même endroit.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm lp-fade-up lp-fade-up-d4">
              <button
                onClick={() => basculerVersFormulaire(true)}
                className="btn btn-ghost flex-1 rounded-xl font-semibold border border-base-300 bg-base-100/50 backdrop-blur-sm transition-all duration-200 hover:bg-base-100/80 hover:border-base-content/15 active:scale-[0.98]">
                Se connecter
              </button>
              
              <button
                onClick={() => basculerVersFormulaire(false)}
                className="btn btn-ghost flex-1 rounded-xl font-semibold border border-base-300 bg-base-100/50 backdrop-blur-sm transition-all duration-200 hover:bg-base-100/80 hover:border-base-content/15 active:scale-[0.98]">
                S'inscrire
              </button>
            </div>
          </div>
        </div>

        <div className="w-1/2 h-full relative flex items-center justify-center px-6">
          <div className="w-full max-w-sm bg-base-100/70 backdrop-blur-xl rounded-3xl border border-base-300/50 shadow-2xl shadow-black/5 p-8">

            <button
              onClick={basculerVersAccueil}
              className="flex items-center gap-1.5 text-sm text-base-content/40 transition-colors duration-200 hover:text-base-content/70 mb-6">
              <ArrowLeft size={14} />
              Retour
            </button>

            <h1 className="text-2xl font-bold text-base-content mb-1">
              {isLogin ? 'Connexion' : 'Créer un compte'}
            </h1>
            <p className="text-sm text-base-content/50 mb-7">
              {isLogin ? 'Entrez vos identifiants pour continuer.' : 'Remplissez les champs ci-dessous.'}
            </p>

            {authError && (
              <div className="mb-4 px-4 py-3 bg-error/10 border border-error/20 rounded-xl text-error text-sm">
                {authError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-medium text-base-content/60 mb-1.5 block">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  className="input input-bordered w-full rounded-xl bg-base-200/40 focus:bg-base-100 transition-colors"
                  placeholder="vous@exemple.com" required />
              </div>
              <div>
                <label className="text-xs font-medium text-base-content/60 mb-1.5 block">Mot de passe</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  className="input input-bordered w-full rounded-xl bg-base-200/40 focus:bg-base-100 transition-colors"
                  placeholder="••••••••" required />
              </div>

              {!isLogin && (
                <div className="flex flex-col gap-1.5 mt-[-4px] mb-2 text-xs font-medium">
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
              )}

              <div className="flex justify-center mt-2 mb-2 rounded-lg overflow-hidden">
                <HCaptcha
                  sitekey={import.meta.env.VITE_HCAPTCHA_SITE_KEY || "10000000-ffff-ffff-ffff-000000000001"}
                  onVerify={(token) => setCaptchaToken(token)}
                  theme="dark"
                />
              </div>

              <button 
                type="submit" 
                disabled={(isLogin && !canSubmitLogin) || (!isLogin && !canSubmitSignup)}
                className={`btn btn-primary w-full rounded-xl font-semibold mt-2 transition-all duration-200 
                  ${((isLogin && !canSubmitLogin) || (!isLogin && !canSubmitSignup)) 
                    ? 'opacity-50 cursor-not-allowed bg-base-300 text-base-content/50 border-none shadow-none' 
                    : 'shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 active:scale-[0.98]'
                  }`}
              >
                {isLogin ? 'Se connecter' : "S'inscrire"}
              </button>
            </form> 

            <p className="text-sm text-center text-base-content/40 mt-6">
              {isLogin ? 'Pas encore de compte ?' : 'Déjà un compte ?'}{' '}
              <button onClick={() => basculerVersFormulaire(!isLogin)}
                className="text-primary font-medium transition-opacity duration-200 hover:opacity-80">
                {isLogin ? "S'inscrire" : 'Se connecter'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
