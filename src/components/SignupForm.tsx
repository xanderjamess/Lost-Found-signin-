import React from 'react';
import { motion } from 'motion/react';
import { User, Mail, Lock, BookOpen, GraduationCap, Hash, Camera, Loader2, ArrowRight, CheckCircle2, ChevronLeft, Eye, EyeOff } from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, query, collection, where, getDocs, getDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';

interface SignupFormProps {
  onBack: () => void;
  onSuccess: () => void;
  onLogin: () => void;
}

export default function SignupForm({ onBack, onSuccess, onLogin }: SignupFormProps) {
  const [formData, setFormData] = React.useState({
    fullName: '',
    studentId: '',
    schoolEmail: '',
    course: '',
    yearLevel: '1st Year',
    password: '',
    confirmPassword: '',
  });

  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [showPassword, setShowPassword] = React.useState(false);
  const [passwordValidation, setPasswordValidation] = React.useState({
    length: false,
    uppercase: false,
    number: false,
  });

  const yearLevels = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year', 'Graduate'];

  const validatePassword = (pass: string) => {
    setPasswordValidation({
      length: pass.length >= 8,
      uppercase: /[A-Z]/.test(pass),
      number: /[0-9]/.test(pass),
    });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFormData({ ...formData, password: val });
    validatePassword(val);
  };

  const isPasswordValid = passwordValidation.length && passwordValidation.uppercase && passwordValidation.number;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Initial validations
    if (!formData.schoolEmail.endsWith('.edu.ph')) {
      setError('Please use a valid school email address (.edu.ph)');
      return;
    }
    if (!isPasswordValid) {
      setError('Password does not meet requirements');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      // Check if student ID is unique
      try {
        const q = query(collection(db, 'users'), where('studentId', '==', formData.studentId));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          throw new Error('Student ID is already registered');
        }
      } catch (err: any) {
        if (err.message === 'Student ID is already registered') throw err;
        handleFirestoreError(err, OperationType.LIST, 'users');
      }

      // Create user
      const userCredential = await createUserWithEmailAndPassword(auth, formData.schoolEmail, formData.password);
      const user = userCredential.user;

      // Save user profile
      try {
        await setDoc(doc(db, 'users', user.uid), {
          fullName: formData.fullName,
          studentId: formData.studentId,
          schoolEmail: formData.schoolEmail,
          course: formData.course,
          yearLevel: formData.yearLevel,
          role: 'student', // Default role
          createdAt: new Date().toISOString()
        });
      } catch (err: any) {
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
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
            Signup method "Email/Password" is not enabled. Please enable it in the{' '}
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
      } else if (err.code === 'auth/email-already-in-use') {
        setError('This email address is already registered to another account.');
      } else if (err.code === 'auth/invalid-credential' || err.message?.includes('invalid-credential')) {
        setError('Invalid credentials provided. Please check your information and try again.');
      } else if (err.code === 'auth/weak-password') {
        setError('The password is too weak. Please choose a stronger password.');
      } else {
        setError(err.message || 'An error occurred during signup');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Check if user exists first to decide whether to create or ignore
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
            course: 'Not Provided',
            yearLevel: '1st Year',
            role: 'student',
            createdAt: new Date().toISOString()
          });
        } catch (err: any) {
          handleFirestoreError(err, OperationType.WRITE, `users/${result.user.uid}`);
        }
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
            Google sign-up is not allowed. Please enable Google provider in the{' '}
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
            Google sign-up failed (invalid credential). This usually happens when Google Sign-In is misconfigured, disabled, or pending configuration in your{' '}
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
        setError(err.message || 'Failed to sign up with Google');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 flex items-center justify-center">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full glass-card bg-white p-8 md:p-12 shadow-2xl relative"
      >
        <button 
          onClick={onBack}
          className="absolute left-8 top-8 text-slate-400 hover:text-primary transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-widest"
        >
          <ChevronLeft size={16} />
          Back
        </button>

        <div className="text-center mb-10 mt-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-primary/10 mb-6 shadow-sm">
            <User size={40} className="text-primary" />
          </div>
          <h1 className="text-4xl font-display font-bold text-slate-900 mb-3 tracking-tight">Create Account</h1>
          <p className="text-slate-500 font-medium">Join our community to report and claim lost items</p>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-medium">
            <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              !
            </div>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Full Name */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input 
                  type="text" 
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="e.g. John Doe"
                  className="input-field pl-12 py-3"
                />
              </div>
            </div>

            {/* Student ID */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest">
                Student ID
              </label>
              <div className="relative">
                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input 
                  type="text" 
                  required
                  value={formData.studentId}
                  onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                  placeholder="e.g. 2024-XXXX-XXXXX"
                  className="input-field pl-12 py-3"
                />
              </div>
            </div>

            {/* Course */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest">
                Course / Major
              </label>
              <div className="relative">
                <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input 
                  type="text" 
                  required
                  value={formData.course}
                  onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                  placeholder="e.g. BS Computer Science"
                  className="input-field pl-12 py-3"
                />
              </div>
            </div>

            {/* Year Level */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest">
                Year Level
              </label>
              <div className="relative">
                <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <select 
                  className="input-field pl-12 py-3 appearance-none"
                  value={formData.yearLevel}
                  onChange={(e) => setFormData({ ...formData, yearLevel: e.target.value })}
                >
                  {yearLevels.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* School Email */}
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest">
                School Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input 
                  type="email" 
                  required
                  value={formData.schoolEmail}
                  onChange={(e) => setFormData({ ...formData, schoolEmail: e.target.value })}
                  placeholder="e.g. jdoe2024-xxxx-xxxxx@bicol-u.edu.ph"
                  className="input-field pl-12 py-3"
                />
              </div>
              <p className="mt-2 text-[10px] text-slate-400 font-medium">Must be a valid university email address.</p>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input 
                  type={showPassword ? "text" : "password"} 
                  required
                  value={formData.password}
                  onChange={handlePasswordChange}
                  placeholder="••••••••"
                  className="input-field pl-12 pr-12 py-3"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className={`flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest ${passwordValidation.length ? 'text-green-500' : 'text-slate-300'}`}>
                  <CheckCircle2 size={12} /> 8+ Characters
                </div>
                <div className={`flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest ${passwordValidation.uppercase ? 'text-green-500' : 'text-slate-300'}`}>
                  <CheckCircle2 size={12} /> Uppercase Letter
                </div>
                <div className={`flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest ${passwordValidation.number ? 'text-green-500' : 'text-slate-300'}`}>
                  <CheckCircle2 size={12} /> At least 1 Number
                </div>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input 
                  type={showPassword ? "text" : "password"} 
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                  className="input-field pl-12 py-3"
                />
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading || !isPasswordValid}
            className="w-full btn-primary disabled:opacity-50 disabled:translate-y-0 py-4 shadow-xl shadow-primary/20 flex items-center justify-center gap-3 uppercase tracking-widest text-sm font-bold"
          >
            {isLoading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                Create Account <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-widest">
            <span className="px-4 bg-white text-slate-400">Or sign up with</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGoogleSignup}
          disabled={isLoading}
          className="w-full py-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-all flex items-center justify-center gap-3 font-bold uppercase tracking-widest text-xs disabled:opacity-50"
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

        <div className="mt-8 text-center">
          <p className="text-xs text-slate-500 font-medium">
            Already have an account? {' '}
            <button 
              onClick={onLogin}
              className="text-primary font-bold hover:underline"
            >
              Login instead
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
