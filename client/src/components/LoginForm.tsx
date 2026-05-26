import React from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, ArrowRight, Loader2, Eye, EyeOff, Hash, AlertCircle } from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { signInWithEmailAndPassword, sendPasswordResetEmail, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { collection, query, where, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';

interface LoginFormProps {
  initialRole: 'student' | 'admin';
  onSuccess: () => void;
  onSignup: () => void;
  onBack: () => void;
}

export default function LoginForm({ initialRole, onSuccess, onSignup, onBack }: LoginFormProps) {
  const [role, setRole] = React.useState<'student' | 'admin'>(initialRole);
  const [identifier, setIdentifier] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [resetEmail, setResetEmail] = React.useState('');
  const [isResetMode, setIsResetMode] = React.useState(false);
  const [resetSent, setResetSent] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      let email = identifier;

      if (!identifier.includes('@')) {
        try {
          const q = query(collection(db, 'users'), where('studentId', '==', identifier));
          const querySnapshot = await getDocs(q);
          if (querySnapshot.empty) {
            throw new Error('Student ID not found');
          }
          email = querySnapshot.docs[0].data().schoolEmail;
        } catch (err: any) {
          handleFirestoreError(err, OperationType.LIST, 'users');
        }
      }

      const cred = await signInWithEmailAndPassword(auth, email, password);

      // Ensure we have the user's Firestore profile to check role before navigation.
      try {
        const uid = cred.user?.uid || auth.currentUser?.uid;
        if (uid) {
          const userDoc = await getDoc(doc(db, 'users', uid));
          const roleFromDb = userDoc.exists() ? (userDoc.data() as any).role : null;
          const emailFromAuth = cred.user?.email || auth.currentUser?.email || '';
            if (roleFromDb === 'admin') {
            if (typeof window !== 'undefined' && window.location.pathname !== '/admin') {
              window.history.replaceState(null, '', '/admin');
            }
            return;
          }
          // fallback: if email matches known admin list, redirect
          try {
            const { isUserAdmin } = await import('../lib/admin');
            if (isUserAdmin({ id: uid, email: emailFromAuth, role: roleFromDb })) {
              if (typeof window !== 'undefined' && window.location.pathname !== '/admin') {
                window.history.replaceState(null, '', '/admin');
              }
              return;
            }
          } catch (_) {
            // ignore
          }
        }
      } catch (err) {
        console.warn('Failed to fetch user profile after sign-in', err);
      }

      onSuccess();
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/unauthorized-domain') {
        setError(
          <>
            This domain (<span className="font-mono bg-slate-100 px-1 rounded">{window.location.hostname}</span>) is not authorized for Firebase Auth. 
            Please add it in your{' '}
            <a 
              href="https://console.firebase.google.com/project/campus-lostandfound-2f069/authentication/settings" 
              target="_blank" 
              rel="noopener noreferrer"
              className="underline font-bold text-primary hover:text-primary/80"
            >
              Firebase Console Settings
            </a>{' '}
            under "Authorized domains".
          </>
        );
      } else if (err.code === 'auth/operation-not-allowed') {
        setError(
          <>
            Email/Password login is not enabled. Please enable it in the{' '}
            <a 
              href="https://console.firebase.google.com/project/campus-lostandfound-2f069/authentication/providers" 
              target="_blank" 
              rel="noopener noreferrer"
              className="underline font-bold"
            >
              Firebase Console
            </a>.
          </>
        );
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.message?.includes('invalid-credential')) {
        setError('Invalid email/Student ID or password. Please check your credentials and try again.');
      } else {
        setError(err.message || 'Failed to sign in. Please check your credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      let userDoc;
      try {
        userDoc = await getDoc(doc(db, 'users', result.user.uid));
      } catch (err: any) {
        handleFirestoreError(err, OperationType.GET, `users/${result.user.uid}`);
      }

      if (userDoc && !userDoc.exists()) {
        try {
          await setDoc(doc(db, 'users', result.user.uid), {
            fullName: result.user.displayName || 'Anonymous User',
            schoolEmail: result.user.email,
            studentId: 'Google User',
            role: 'student',
            createdAt: new Date().toISOString()
          });
        } catch (err: any) {
          handleFirestoreError(err, OperationType.WRITE, `users/${result.user.uid}`);
        }
      }
      // After Google sign-in, check role and redirect to admin if appropriate.
      try {
        const uid = result.user.uid;
        const userDoc = await getDoc(doc(db, 'users', uid));
        const roleFromDb = userDoc.exists() ? (userDoc.data() as any).role : null;
        if (roleFromDb === 'admin') {
          if (typeof window !== 'undefined' && window.location.pathname !== '/admin') {
            window.history.replaceState(null, '', '/admin');
          }
          return;
        }
      } catch (err) {
        console.warn('Failed to fetch user profile after Google sign-in', err);
      }

      onSuccess();
    } catch (err: any) {
      console.error(err);
      if (err.message && err.message.includes('{"error":')) {
        const parsedError = JSON.parse(err.message);
        setError(`Database Error: ${parsedError.error}. Please ensure you have an active internet connection.`);
      } else if (err.code === 'auth/unauthorized-domain') {
        setError(
          <>
            This domain (<span className="font-mono bg-slate-100 px-1 rounded">{window.location.hostname}</span>) is not authorized for Firebase Auth. 
            Please add it in your{' '}
            <a 
              href="https://console.firebase.google.com/project/campus-lostandfound-2f069/authentication/settings" 
              target="_blank" 
              rel="noopener noreferrer"
              className="underline font-bold text-primary hover:text-primary/80"
            >
              Firebase Console Settings
            </a>{' '}
            under "Authorized domains".
          </>
        );
      } else if (err.code === 'auth/operation-not-allowed') {
        setError(
          <>
            Google sign-in is not enabled. Please enable it in the{' '}
            <a 
              href="https://console.firebase.google.com/project/campus-lostandfound-2f069/authentication/providers" 
              target="_blank" 
              rel="noopener noreferrer"
              className="underline font-bold"
            >
              Firebase Console
            </a>.
          </>
        );
      } else if (err.code === 'auth/invalid-credential' || err.message?.includes('invalid-credential')) {
        setError(
          <>
            Google sign-in failed (invalid credential). This usually happens when Google Sign-In is misconfigured, disabled, or pending configuration in your{' '}
            <a 
              href="https://console.firebase.google.com/project/campus-lostandfound-2f069/authentication/providers" 
              target="_blank" 
              rel="noopener noreferrer"
              className="underline font-bold text-primary hover:text-primary/80"
            >
              Firebase Console Providers settings
            </a>.
          </>
        );
      } else {
        setError(err.message || 'Failed to sign in with Google');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetSent(true);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/operation-not-allowed') {
        setError('Password reset is not enabled in the Firebase Console. Please enable Email/Password provider.');
      } else {
        setError(err.message || 'Failed to send reset email');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const roleTitle = role === 'admin' ? 'Administrator Login' : 'User Login';
  const buttonBg = role === 'admin' ? 'bg-accent hover:bg-accent/90 shadow-accent/20' : 'bg-primary hover:bg-primary/90 shadow-primary/20';

  if (isResetMode) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card-pad w-full max-w-md"
        >
          <div className="text-center mb-10">
            <h1 className="text-3xl font-sans font-bold text-fg mb-2">Forgot Password</h1>
            <p className="text-muted font-medium">Enter your school email to receive a reset link</p>
          </div>

          {resetSent ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Mail size={32} />
              </div>
              <h2 className="text-xl font-bold mb-2">Email Sent!</h2>
              <p className="text-muted mb-8">Please check your inbox for instructions to reset your password.</p>
              <button 
                onClick={() => setIsResetMode(false)}
                className="w-full btn-primary py-4"
              >
                Back to Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-6">
              {error && (
                <div className="p-3 bg-red-50 text-red-600 text-xs rounded-lg flex items-center gap-2">
                  <AlertCircle size={14} /> {error}
                </div>
              )}
              <div>
                <label className="block text-[10px] font-bold text-muted mb-2  ">School Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
                  <input 
                    type="email" 
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="input-field pl-12 py-3"
                    placeholder="e.g. user@bicol-u.edu.ph"
                  />
                </div>
              </div>
              <button disabled={isLoading} type="submit" className="w-full btn-primary py-4">
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Send Reset Link'}
              </button>
              <button 
                type="button"
                onClick={() => setIsResetMode(false)}
                className="w-full text-muted hover:text-primary transition-colors text-[10px] font-bold   mt-4"
              >
                Cancel
              </button>
            </form>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card-pad w-full max-w-md"
      >
        {/* Role Toggle */}
        <div className="mb-8 p-1 bg-surface-raised rounded-xl flex">
          <button
            type="button"
            onClick={() => setRole('student')}
            className={`flex-1 py-3 rounded-lg text-xs font-bold transition-all ${
              role === 'student'
                ? 'bg-surface text-primary shadow-sm'
                : 'text-muted hover:bg-surface hover:text-fg'
            }`}
          >
            Student
          </button>
          <button
            type="button"
            onClick={() => setRole('admin')}
            className={`flex-1 py-3 rounded-lg text-xs font-bold transition-all ${
              role === 'admin'
                ? 'bg-surface text-accent shadow-sm'
                : 'text-muted hover:bg-surface hover:text-fg'
            }`}
          >
            Admin
          </button>
        </div>

        <div className="text-center mb-10">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6 shadow-sm transition-colors duration-300 ${role === 'admin' ? 'bg-accent/10' : 'bg-primary/10'}`}>
            {role === 'admin' ? (
              <Lock key="admin-icon" size={32} className="text-accent" />
            ) : (
              <Mail key="student-icon" size={32} className="text-primary" />
            )}
          </div>
          <h1 className="text-3xl font-sans font-bold text-fg mb-2 tracking-tight transition-all">{roleTitle}</h1>
          <p className="text-muted font-medium">Enter your credentials to access your account</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-bold flex items-center gap-2">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[10px] font-bold text-muted mb-2  ">
              Email or Student ID
            </label>
            <div className="relative">
              {identifier.includes('@') ? (
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
              ) : (
                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
              )}
              <input 
                type="text" 
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. 2024-XXXX-XXXXX or email"
                className="input-field pl-12 py-3"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="block text-[10px] font-bold text-muted  ">
                Password
              </label>
              <button 
                type="button" 
                onClick={() => setIsResetMode(true)}
                className="text-[10px] font-bold text-primary hover:underline  "
              >
                Forgot?
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
              <input 
                type={showPassword ? "text" : "password"} 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-field pl-12 pr-12 py-3"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-muted transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="flex items-center">
            <input 
              id="remember-me" 
              type="checkbox" 
              className="h-4 w-4 text-primary ring-border rounded focus:ring-primary/20" 
            />
            <label htmlFor="remember-me" className="ml-2 block text-xs text-muted font-medium">
              Remember me for 30 days
            </label>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className={`w-full py-4 rounded-xl text-primary-fg font-bold flex items-center justify-center transition-all  ${buttonBg} disabled:opacity-70   text-sm`}
          >
            {isLoading ? (
              <>
                <Loader2 size={20} className="mr-2 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                Sign In <ArrowRight size={20} className="ml-2" />
              </>
            )}
          </button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t ring-border"></div>
          </div>
          <div className="relative flex justify-center text-[10px] font-bold  ">
            <span className="px-4 bg-surface text-muted">Or continue with</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full py-4 rounded-xl border ring-border bg-surface hover:bg-bg transition-all flex items-center justify-center gap-3 font-bold   text-xs disabled:opacity-50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Google Account
        </button>

        <div className="mt-8 text-center space-y-4">
          <p className="text-xs text-muted font-medium">
            Don't have an account? {' '}
            <button 
              onClick={onSignup}
              className="text-primary font-bold hover:underline"
            >
              Sign up now
            </button>
          </p>
          <button 
            onClick={onBack}
            className="text-muted hover:text-primary transition-colors text-[10px] font-bold   block w-full"
          >
            ← Back to selection
          </button>
        </div>
      </motion.div>
    </div>
  );
}

