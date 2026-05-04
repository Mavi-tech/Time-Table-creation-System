import React, { createContext, useState, useContext } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = sessionStorage.getItem('tt_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [tenant, setTenantState] = useState(() => {
    const localSaved = localStorage.getItem('tt_tenant');
    if (localSaved) return JSON.parse(localSaved);

    // Backward compatibility: migrate older sessionStorage tenant data.
    const legacySaved = sessionStorage.getItem('tt_tenant');
    if (legacySaved) {
      localStorage.setItem('tt_tenant', legacySaved);
      sessionStorage.removeItem('tt_tenant');
      return JSON.parse(legacySaved);
    }

    return null;
  });

  const login = (userData) => {
    sessionStorage.setItem('tt_user', JSON.stringify(userData));
    setUser(userData);
  };

  const setTenant = (tenantData) => {
    localStorage.setItem('tt_tenant', JSON.stringify(tenantData));
    setTenantState(tenantData);
  };

  const clearTenant = () => {
    localStorage.removeItem('tt_tenant');
    setTenantState(null);
  };

  const updateUser = (patch) => {
    setUser(prev => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      sessionStorage.setItem('tt_user', JSON.stringify(next));
      return next;
    });
  };

  const logout = () => {
    sessionStorage.removeItem('tt_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, tenant, setTenant, clearTenant }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
