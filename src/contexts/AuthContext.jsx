import React, { createContext, useContext } from 'react';

const AuthContext = createContext();

export function AuthProvider({ 
  children, session, monProfil, utilisateursEnLigne, profilsCache, getStatutEffectif, 
  blockedUsers = [], 
  blockedBy = [], 
  chargerBlocages = () => {} 
}) {
  const pseudo = monProfil?.pseudo || session?.user?.email?.split('@')[0];
  
  const value = {
    session,
    monProfil,
    pseudo,
    isAuthenticated: !!session,
    utilisateursEnLigne,
    profilsCache,
    getStatutEffectif,
    blockedUsers,
    blockedBy,
    chargerBlocages
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);