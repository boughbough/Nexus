import React, { createContext, useContext, useState } from 'react';

const UIContext = createContext();

export function UIProvider({ children, ajouterToast }) {
  const [menuMobileOuvert, setMenuMobileOuvert] = useState(false);
  const toggleMenuMobile = () => setMenuMobileOuvert(prev => !prev);
  const fermerMenuMobile = () => setMenuMobileOuvert(false);

  const value = { ajouterToast, menuMobileOuvert, toggleMenuMobile, fermerMenuMobile };

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export const useUI = () => useContext(UIContext);