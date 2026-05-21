import React from 'react';
import { Users, ShieldCheck, ArrowRight, ArrowLeft, Mail, Lock, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LoginProps {
  onLogin: (role: 'student' | 'admin') => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [selectedRole, setSelectedRole] = React.useState<'student' | 'admin' | null>(null);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !selectedRole) return;
    
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      onLogin(selectedRole);
    }, 1500);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-20">
      <AnimatePresence mode="wait">
        {!selectedRole ? (
          <motion.div
            key="role-selection"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center"
          >
            <h1 className="text-4xl font-display font-bold text-primary mb-6">Welcome to Campus E-Lost and Found</h1>
            <p className="text-xl text-gray-500 mb-12">Please select your role to continue to the Lost & Found system.</p>
            
            <div className="space-y-6">
              <button 
                onClick={() => setSelectedRole('student')}
                className="w-full glass-card p-8 hover:border-primary/50 transition-all group text-left flex items-center"
              >
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mr-6 group-hover:scale-110 transition-transform">
                  <Users size={28} className="text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-primary">Student Login</h3>
                  <p className="text-sm text-gray-500">Report and track your items</p>
                </div>
                <ArrowRight size={20} className="ml-auto text-gray-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </button>
              
              <button 
                onClick={() => setSelectedRole('admin')}
                className="w-full glass-card p-8 hover:border-accent/50 transition-all group text-left flex items-center"
              >
                <div className="w-14 h-14 bg-accent/10 rounded-xl flex items-center justify-center mr-6 group-hover:scale-110 transition-transform">
                  <ShieldCheck size={28} className="text-accent" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-accent">Administrator Login</h3>
                  <p className="text-sm text-gray-500">Manage campus-wide reports</p>
                </div>
                <ArrowRight size={20} className="ml-auto text-gray-300 group-hover:text-accent group-hover:translate-x-1 transition-all" />
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="login-form"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="glass-card p-10"
          >
            <button 
              onClick={() => setSelectedRole(null)}
              className="flex items-center text-sm text-gray-400 hover:text-primary mb-8 transition-colors"
            >
              <ArrowLeft size={16} className="mr-2" />
              Back to role selection
            </button>

            <div className="mb-8">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                selectedRole === 'student' ? 'bg-primary/10' : 'bg-accent/10'
              }`}>
                {selectedRole === 'student' ? (
                  <Users size={24} className="text-primary" />
                ) : (
                  <ShieldCheck size={24} className="text-accent" />
                )}
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                {selectedRole === 'student' ? 'Student' : 'Administrator'} Login
              </h2>
              <p className="text-gray-500">Enter your credentials to access your dashboard.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="email" 
                    required
                    placeholder="e.g. cccc1111-1111-11111@bicol-u.edu.ph"
                    className="input-field pl-12"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="password" 
                    required
                    placeholder="••••••••"
                    className="input-field pl-12"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input type="checkbox" className="rounded border-gray-300 text-primary focus:ring-primary" />
                  <span className="ml-2 text-sm text-gray-500">Remember me</span>
                </label>
                <button type="button" className="text-sm text-primary hover:underline font-medium">
                  Forgot password?
                </button>
              </div>

              <button 
                type="submit" 
                disabled={isLoading}
                className={`w-full py-3 rounded-xl font-bold text-white transition-all flex items-center justify-center ${
                  selectedRole === 'student' ? 'bg-primary hover:bg-primary-dark' : 'bg-accent hover:bg-accent-dark'
                } ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={20} className="mr-2 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
