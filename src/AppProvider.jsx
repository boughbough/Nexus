import React from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { UIProvider } from './contexts/UIContext';

export default function AppProvider({ 
  children, session, monProfil, ajouterToast, utilisateursEnLigne, profilsCache, getStatutEffectif,
  blockedUsers, 
  blockedBy, 
  chargerBlocages 
}) {
  return (
    <AuthProvider 
      session={session} 
      monProfil={monProfil} 
      utilisateursEnLigne={utilisateursEnLigne} 
      profilsCache={profilsCache} 
      getStatutEffectif={getStatutEffectif}
      blockedUsers={blockedUsers}
      blockedBy={blockedBy}
      chargerBlocages={chargerBlocages}
    >
      <UIProvider ajouterToast={ajouterToast}>
        {children}
      </UIProvider>
    </AuthProvider>
  );
}