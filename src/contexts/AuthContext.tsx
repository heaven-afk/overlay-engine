'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut, updateProfile, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { updateUserDisplayNameInTeams } from '@/lib/db';

interface AuthContextType {
  user: User | null;
  displayName: string;
  loading: boolean;
  logout: () => Promise<void>;
  updateDisplayName: (newName: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Sync authenticated user state with Firebase
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        const cached = typeof window !== 'undefined' ? localStorage.getItem(`overlay_display_name_${u.uid}`) : null;
        const initialName = u.displayName || cached || (u.email ? u.email.split('@')[0] : '');
        setDisplayName(initialName);
      } else {
        setDisplayName('');
      }
      setLoading(false);
    });
    
    return unsubscribe;
  }, []);

  const logout = () => signOut(auth);

  const handleUpdateDisplayName = async (newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed || !auth.currentUser) return;

    // 1. Update Firebase Auth Profile
    await updateProfile(auth.currentUser, { displayName: trimmed });
    
    // 2. Cache in localStorage for immediate retrieval
    if (typeof window !== 'undefined') {
      localStorage.setItem(`overlay_display_name_${auth.currentUser.uid}`, trimmed);
    }
    
    // 3. Update React state
    setDisplayName(trimmed);

    // 4. Propagate to teams in Firestore
    await updateUserDisplayNameInTeams(auth.currentUser.uid, trimmed);
  };

  return (
    <AuthContext.Provider value={{ user, displayName, loading, logout, updateDisplayName: handleUpdateDisplayName }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

