import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  User as FirebaseUser,
  signOut
} from 'firebase/auth';
import { doc, getDoc, getDocFromCache } from 'firebase/firestore';
import { isUserAdmin } from '../lib/admin';
import { auth, db } from '../lib/firebase';
import { OperationType, setFirestoreOnline } from '../lib/firestoreUtils';
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
    const docRef = doc(db, 'users', firebaseUser.uid);
    let userDoc = null;

    try {
      userDoc = await getDoc(docRef);
      setFirestoreOnline();
    } catch (error: any) {
      const code = error?.code || '';
      const message = error?.message?.toLowerCase() || '';

      const isOfflineError =
        code === 'unavailable' ||
        code === 'deadline-exceeded' ||
        message.includes('offline') ||
        message.includes('unreachable');

      const isPermissionError = code === 'permission-denied';

      if (isOfflineError) {
        // Try cache first
        try {
          userDoc = await getDocFromCache(docRef);
          console.log('Successfully fetched user document from cache');
        } catch {
          // Cache miss — fall through to offline fallback below
        }
      } else if (isPermissionError) {
        // Brand-new Google user: their Firestore doc doesn't exist yet.
        // The LoginForm will create it. Set user to null and let the
        // onAuthStateChanged re-fire after setDoc completes.
        console.warn('User doc not found or permission denied — likely a new Google sign-in user. Waiting for profile creation.');
        // Use minimal auth-only user so the app doesn't get stuck
        const role = isUserAdmin({ id: firebaseUser.uid, email: firebaseUser.email || undefined, role: undefined }) ? 'admin' : 'student';
        setUser({
          id: firebaseUser.uid,
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'New User',
          email: firebaseUser.email || '',
          role,
          avatar: firebaseUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(firebaseUser.displayName || 'New User')}&background=random`,
          studentId: 'Google User',
          course: '',
          yearLevel: '',
        } as any);
        setLoading(false);
        return;
      } else {
        console.warn('Unexpected Firestore error fetching user doc:', error);
      }

      // Offline and no cache — use fallback
      if (!userDoc) {
        console.warn('Using offline fallback user configuration');
        const role = isUserAdmin({ id: firebaseUser.uid, email: firebaseUser.email || undefined, role: undefined }) ? 'admin' : 'student';
        setUser({
          id: firebaseUser.uid,
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Authenticated User',
          email: firebaseUser.email || '',
          role,
          avatar: firebaseUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(firebaseUser.displayName || 'Authenticated User')}&background=random`,
          studentId: 'Offline Mode',
          course: 'Not Available',
          yearLevel: 'Unknown',
        } as any);
        setLoading(false);
        return;
      }
    }

    try {
      if (userDoc && userDoc.exists()) {
        const data = userDoc.data();
        const role = isUserAdmin({ id: firebaseUser.uid, email: firebaseUser.email || undefined, role: data?.role })
          ? 'admin'
          : (data.role || 'student');
        setUser({
          id: firebaseUser.uid,
          name: data.fullName,
          email: data.schoolEmail || firebaseUser.email,
          role,
          avatar: data.avatar || firebaseUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.fullName)}&background=random`,
          studentId: data.studentId,
          course: data.course,
          yearLevel: data.yearLevel,
        } as any);
      } else {
        // Doc doesn't exist yet (new Google user whose setDoc hasn't run yet)
        if (isUserAdmin({ id: firebaseUser.uid, email: firebaseUser.email || undefined, role: undefined })) {
          setUser({
            id: firebaseUser.uid,
            name: firebaseUser.displayName || 'Admin User',
            email: firebaseUser.email,
            role: 'admin',
            avatar: firebaseUser.photoURL || `https://ui-avatars.com/api/?name=Admin&background=random`,
            studentId: 'ADMIN-01',
            course: 'Security',
            yearLevel: 'Staff',
          } as any);
        } else {
          // New user — set a minimal student profile; LoginForm's setDoc will persist it
          setUser({
            id: firebaseUser.uid,
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'New User',
            email: firebaseUser.email || '',
            role: 'student',
            avatar: firebaseUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(firebaseUser.displayName || 'New User')}&background=random`,
            studentId: 'Google User',
            course: '',
            yearLevel: '',
          } as any);
        }
      }
    } catch (error) {
      console.error('Error mapping user doc to User type:', error);
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

  useEffect(() => {
    const INACTIVITY_LIMIT = 60 * 60 * 1000;

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
    }, 60000);

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