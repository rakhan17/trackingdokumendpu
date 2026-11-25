import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from 'firebase/auth';
import { auth } from '../firebase';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}
const AuthContext = createContext<AuthContextValue | null>(null);

// Firebase Email/Password remains the identity provider, but users enter only
// their username. The corresponding Firebase Auth email is internal.
const usernameToAuthEmail = (username: string) =>
  `${username.trim().toLowerCase()}@trackingdokumenpu.firebaseapp.com`;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => onAuthStateChanged(auth, next => { setUser(next); setLoading(false); }), []);
  const value = useMemo<AuthContextValue>(() => ({
    user, loading,
    login: async (username, password) => {
      await signInWithEmailAndPassword(auth, usernameToAuthEmail(username), password);
    },
    logout: async () => { await signOut(auth); }
  }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}