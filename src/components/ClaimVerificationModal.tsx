import React from 'react';
import { Item, User, Claim } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  ShieldCheck, 
  User as UserIcon, 
  Calendar, 
  MapPin, 
  Package, 
  CheckCircle2, 
  Info,
  ExternalLink,
  Camera,
  MessageSquare,
  Shield,
  Clock,
  Download
} from 'lucide-react';

interface ClaimVerificationModalProps {
  item: Item;
  users: User[];
  claims: Claim[];
  isOpen: boolean;
  onClose: () => void;
}

export default function ClaimVerificationModal({ 
  item, 
  users, 
  claims, 
  isOpen, 
  onClose 
}: ClaimVerificationModalProps) {
  if (!isOpen) return null;

  const claimer = users.find(u => u.id === item.claimedBy);
  const reporter = users.find(u => u.id === item.reporterId);
  const approver = users.find(u => u.id === item.approvedBy);
  const successfulClaim = claims.find(c => c.itemId === item.id && c.userId === item.claimedBy && c.status === 'approved');

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]"
        >
          {/* Left Side: Images */}
          <div className="md:w-1/2 bg-slate-50 border-r border-slate-100 overflow-y-auto">
            <div className="p-8 space-y-8">
              <div>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center">
                  <Package size={14} className="mr-2" /> Original Item Photo
                </h4>
                <div className="relative group">
                  <img 
                    src={item.imageUrl} 
                    alt={item.title} 
                    className="w-full aspect-[4/3] object-cover rounded-2xl shadow-md border border-slate-200"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-4 right-4 bg-primary text-white text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-tighter shadow-lg">
                    Reported {item.type}
                  </div>
                </div>
              </div>

              {successfulClaim?.proofImageUrl && (
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center">
                    <Camera size={14} className="mr-2" /> Claimant's Proof Photo
                  </h4>
                  <div className="relative">
                    <img 
                      src={successfulClaim.proofImageUrl} 
                      alt="Proof" 
                      className="w-full aspect-[4/3] object-cover rounded-2xl shadow-md border border-emerald-100"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-4 right-4 bg-emerald-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-tighter shadow-lg flex items-center">
                      <ShieldCheck size={12} className="mr-1.5" /> Identity Verified
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Side: Details */}
          <div className="md:w-1/2 flex flex-col overflow-hidden bg-white">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-slate-900 leading-tight">Claim Verification History</h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5 tracking-tight uppercase">Case Reference: #{item.id.slice(-8)}</p>
              </div>
              <button 
                onClick={onClose}
                className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-grow overflow-y-auto p-8 space-y-8">
              {/* Verification IDs */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                  <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">Item Ref ID</h4>
                  <p className="text-sm font-mono font-bold text-primary">{item.id.toUpperCase()}</p>
                </div>
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <h4 className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Verification ID</h4>
                  <p className="text-sm font-mono font-bold text-emerald-600">{successfulClaim?.verificationId || 'N/A'}</p>
                </div>
              </div>

              {/* Item Info section */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest">Item Information</h4>
                  <span className="px-2 py-1 bg-primary/5 text-primary text-[9px] font-bold rounded-md uppercase tracking-wider">{item.category}</span>
                </div>
                <div className="bg-slate-50 rounded-2xl p-5 space-y-4">
                  <h5 className="text-lg font-bold text-slate-900">{item.title}</h5>
                  <p className="text-sm text-slate-500 leading-relaxed font-medium">{item.description}</p>
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="flex items-center text-xs text-slate-600 font-medium">
                      <MapPin size={14} className="mr-2 text-slate-400" />
                      {item.location}
                    </div>
                    <div className="flex items-center text-xs text-slate-600 font-medium">
                      <Calendar size={14} className="mr-2 text-slate-400" />
                      Reported {new Date(item.date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </section>

              {/* Participants section */}
              <section className="space-y-4">
                <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest">Involved Parties</h4>
                <div className="grid grid-cols-1 gap-3">
                  {/* Claimant */}
                  <div className="flex items-center p-3 bg-white border border-slate-100 rounded-2xl shadow-sm">
                    <img src={claimer?.avatar} className="w-10 h-10 rounded-full border border-slate-50" referrerPolicy="no-referrer" />
                    <div className="ml-3 flex-grow">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Claimant (Owner)</p>
                      <p className="text-sm font-bold text-slate-900">{claimer?.name}</p>
                    </div>
                    <div className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-full">Owner</div>
                  </div>

                  {/* Reporter */}
                  <div className="flex items-center p-3 bg-white border border-slate-100 rounded-2xl shadow-sm">
                    <img src={reporter?.avatar} className="w-10 h-10 rounded-full border border-slate-50" referrerPolicy="no-referrer" />
                    <div className="ml-3 flex-grow">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Reported By</p>
                      <p className="text-sm font-bold text-slate-900">{reporter?.name}</p>
                    </div>
                    <div className="px-3 py-1 bg-slate-50 text-slate-500 text-[10px] font-bold rounded-full">{item.type === 'found' ? 'Finder' : 'Owner'}</div>
                  </div>
                </div>
              </section>

              {/* Verification Details */}
              <section className="space-y-4">
                <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest">Verification Logs</h4>
                <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
                  <div className="relative">
                    <div className="absolute -left-[19px] top-1 w-2.5 h-2.5 rounded-full bg-primary border-4 border-white shadow-sm ring-1 ring-slate-100"></div>
                    <div>
                      <p className="text-[11px] font-bold text-slate-900">Claim Requested</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{new Date(successfulClaim?.date || '').toLocaleString()}</p>
                      {successfulClaim?.message && (
                        <div className="mt-2 p-3 bg-slate-50 rounded-xl border border-slate-100 italic text-[11px] text-slate-600 leading-relaxed">
                          "{successfulClaim.message}"
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="relative">
                    <div className="absolute -left-[19px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border-4 border-white shadow-sm ring-1 ring-slate-100"></div>
                    <div>
                      <p className="text-[11px] font-bold text-slate-900">Release Authorized</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{new Date(item.claimedAt || '').toLocaleString()}</p>
                      <div className="mt-3 flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
                          <Shield size={16} />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Approved By</p>
                          <p className="text-xs font-bold text-slate-800">{approver?.name} (Administrator)</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
              <div className="flex items-center text-emerald-600">
                <CheckCircle2 size={16} className="mr-2" />
                <span className="text-xs font-bold uppercase tracking-widest">Case Permanently Verified</span>
              </div>
              <button 
                onClick={() => window.print()}
                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-bold text-slate-600 hover:bg-slate-50 transition-all uppercase tracking-widest shadow-sm flex items-center"
              >
                <Download size={14} className="mr-2" /> Export Case Report
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
