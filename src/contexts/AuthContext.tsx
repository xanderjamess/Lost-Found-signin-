import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  User as FirebaseUser,
  signOut
} from 'firebase/auth';
import { doc, getDoc, getDocFromCache } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { handleFirestoreError, OperationType, setFirestoreOnline } from '../lib/firestoreUtils';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastActivity, setLastActivity] = useState(Date.now());

  const fetchUserData = async (firebaseUser: FirebaseUser) => {
    let userDoc = null;
    const docRef = doc(db, 'users', firebaseUser.uid);
    try {
      userDoc = await getDoc(docRef);
      setFirestoreOnline();
    } catch (error: any) {
      const isOfflineMsg = error.message?.toLowerCase().includes('offline') || error.code === 'unavailable';
      if (isOfflineMsg) {
        try {
          userDoc = await getDocFromCache(docRef);
          console.log('Successfully fetched user document from cache');
        } catch (cacheError) {
          console.warn('Could not retrieve user document from cache', cacheError);
        }
      }
      
      if (!userDoc) {
        // Fallback user if we cannot retrieve it due to offline state
        console.warn('Using offline fallback user configuration');
        const role = (firebaseUser.email === 'xanderjamesmata951@gmail.com' || firebaseUser.email === 'admin@gmail.com') ? 'admin' : 'student';
        setUser({
          id: firebaseUser.uid,
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Authenticated User',
          email: firebaseUser.email || '',
          role: role, // default fallback
          avatar: firebaseUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(firebaseUser.displayName || 'Authenticated User')}&background=random`,
          studentId: 'Offline Mode',
          course: 'Not Available',
          yearLevel: 'Unknown'
        } as any);
        setLoading(false);
        return;
      }
    }

    try {
      if (userDoc && userDoc.exists()) {
        const data = userDoc.data();
        const role = (firebaseUser.email === 'xanderjamesmata951@gmail.com' || firebaseUser.email === 'admin@gmail.com') ? 'admin' : (data.role || 'student');
        setUser({
          id: firebaseUser.uid,
          name: data.fullName,
          email: data.schoolEmail || firebaseUser.email,
          role: role,
          avatar: data.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.fullName)}&background=random`,
          studentId: data.studentId,
          course: data.course,
          yearLevel: data.yearLevel
        } as any);
      } else {
        if (firebaseUser.email === 'xanderjamesmata951@gmail.com' || firebaseUser.email === 'admin@gmail.com') {
          setUser({
            id: firebaseUser.uid,
            name: firebaseUser.displayName || 'Admin User',
            email: firebaseUser.email,
            role: 'admin',
            avatar: firebaseUser.photoURL || `https://ui-avatars.com/api/?name=Admin&background=random`,
            studentId: 'ADMIN-01',
            course: 'Security',
            yearLevel: 'Staff'
          } as any);
        } else {
          setUser(null);
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`, false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        fetchUserData(firebaseUser);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Inactivity check (1 hour)
  useEffect(() => {
    const INACTIVITY_LIMIT = 60 * 60 * 1000; // 1 hour

    const handleActivity = () => setLastActivity(Date.now());
    
    window.addEventListener('mousedown', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('scroll', handleActivity);
    window.addEventListener('touchstart', handleActivity);

    const interval = setInterval(() => {
      if (auth.currentUser && Date.now() - lastActivity > INACTIVITY_LIMIT) {
        console.log('User inactive, logging out...');
        signOut(auth);
      }
    }, 60000); // Check every minute

    return () => {
      window.removeEventListener('mousedown', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      clearInterval(interval);
    };
  }, [lastActivity]);

  const logout = async () => {
    await signOut(auth);
  };

  const refreshUser = async () => {
    if (auth.currentUser) {
      await fetchUserData(auth.currentUser);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
