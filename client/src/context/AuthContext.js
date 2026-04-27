import React, { createContext, useState, useContext } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = sessionStorage.getItem('tt_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [tenant, setTenantState] = useState(() => {
    const saved = sessionStorage.getItem('tt_tenant');
    return saved ? JSON.parse(saved) : null;
  });

  const login = (userData) => {
    sessionStorage.setItem('tt_user', JSON.stringify(userData));
    setUser(userData);
  };

  const setTenant = (tenantData) => {
    sessionStorage.setItem('tt_tenant', JSON.stringify(tenantData));
    setTenantState(tenantData);
  };

  const clearTenant = () => {
    sessionStorage.removeItem('tt_tenant');
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
    sessionStorage.removeItem('tt_tenant');
    setUser(null);
    setTenantState(null);
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
