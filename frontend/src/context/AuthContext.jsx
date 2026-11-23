import { createContext, useContext, useMemo, useState } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => authService.restore());

  const value = useMemo(() => ({
    user,
    isAuthenticated: Boolean(user),
    login: async (identifier, password) => {
      const account = await authService.login(identifier, password);
      authService.persist(account);
      setUser(account);
      return account;
    },
    logout: () => {
      authService.logout();
      setUser(null);
    },
  }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
