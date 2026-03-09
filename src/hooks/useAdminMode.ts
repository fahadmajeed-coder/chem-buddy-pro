import { useState, useEffect, createContext, useContext } from 'react';

const ADMIN_PASSWORD = 'ChemAdmin2024';
const ADMIN_KEY = 'chemanalyst-admin-mode';

export function useAdminMode() {
  const [isAdmin, setIsAdmin] = useState(() => {
    try {
      return sessionStorage.getItem(ADMIN_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const login = (password: string): boolean => {
    if (password === ADMIN_PASSWORD) {
      setIsAdmin(true);
      sessionStorage.setItem(ADMIN_KEY, 'true');
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAdmin(false);
    sessionStorage.removeItem(ADMIN_KEY);
  };

  return { isAdmin, login, logout };
}
