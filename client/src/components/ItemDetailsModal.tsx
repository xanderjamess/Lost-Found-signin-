import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, MapPin, Calendar, Tag, User, AlertCircle, CheckCircle, Camera } from 'lucide-react';
import { Item, User as UserType, Comment } from '../types';
import CommentSection from './CommentSection';
import { compressImage } from '../lib/imageCompression';
import { uploadImageToCloudinary } from '../lib/cloudinary';

interface ItemDetailsModalProps {
  item: Item | null;
  reporter?: UserType | null;
  currentUser?: UserType | null;
  comments: Comment[];
  onClose: () => void;
  onClaim: (itemId: string, message: string, proofImageUrl?: string) => void;
  onUpdateItem?: (itemId: string, updates: Partial<Item>) => void;
  onPostComment: (itemId: string, content: string, parentId?: string) => Promise<void>;
  onDeleteComment: (commentId: string) => Promise<void>;
  onUpdateComment: (commentId: string, updates: Partial<Comment>) => Promise<void>;
  onLoginRedirect?: () => void;
}

export default function ItemDetailsModal({ 
  item, 
  reporter, 
  currentUser, 
  comments,
  onClose, 
  onClaim, 
  onUpdateItem, 
  onPostComment,
  onDeleteComment,
  onUpdateComment,
  onLoginRedirect 
}: ItemDetailsModalProps) {
  const [showClaimForm, setShowClaimForm] = React.useState(false);
  const [claimMessage, setClaimMessage] = React.useState('');
  const [proofImageUrl, setProofImageUrl] = React.useState('');

  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [uploadError, setUploadError] = React.useState<string | null>(null);

  if (!item) return null;

  const handleClaimClick = () => {
    if (!currentUser) {
      onLoginRedirect?.();
      return;
    }
    setShowClaimForm(true);
  };

  const handleClaimSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onClaim(item.id, claimMessage, proofImageUrl);
    setShowClaimForm(false);
    setClaimMessage('');
    setProofImageUrl('');
    setIsUploading(false);
    setUploadProgress(0);
    setUploadError(null);
  };

  const handleProofFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      setUploadProgress(0);
      setUploadError(null);

      let base64ToUpload = '';
      try {
        base64ToUpload = await compressImage(file);
      } catch (err) {
        console.error('Failed to compress proof image:', err);
        try {
          base64ToUpload = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = (e) => reject(e);
            reader.readAsDataURL(file);
          });
        } catch (readErr) {
          setUploadError('Failed to read image file.');
          setIsUploading(false);
          return;
        }
      }

      setProofImageUrl(base64ToUpload); // Immediate visual feedback

      try {
        const secureUrl = await uploadImageToCloudinary(base64ToUpload, (progress) => {
          setUploadProgress(progress);
        });
        setProofImageUrl(secureUrl);
        setIsUploading(false);
      } catch (uploadErr: any) {
        console.error('Failed to upload proof image to Cloudinary:', uploadErr);
        setUploadError(uploadErr.message || 'Image upload failed. Cloudinary credentials may be missing.');
        setIsUploading(false);
      }
    }
  };

  const statusColors = {
    'lost': 'bg-red-100 text-red-700',
    'found': 'bg-accent/10 text-accent',
    'claimed': 'bg-surface-raised text-gray-700',
    'under-review': 'bg-blue-100 text-blue-700',
    'declined': 'bg-surface-raised text-muted'
  };

  const isReporter = currentUser?.id === item.reporterId;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 "
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-surface rounded-3xl  max-w-4xl w-full overflow-hidden flex flex-col md:flex-row h-full sm:h-auto sm:max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Image Section */}
          <div className="md:w-1/2 relative h-48 sm:h-64 md:h-auto bg-surface-raised flex-shrink-0">
            <img
              src={item.imageUrl || 'https://picsum.photos/seed/item/800/600'}
              alt={item.title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute top-4 left-4 sm:top-6 sm:left-6">
              <span className={`px-3 py-1 sm:px-4 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold   shadow-sm ${statusColors[item.status]}`}>
                {item.status}
              </span>
            </div>
            {item.status === 'claimed' && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center ">
                <div className="bg-green-500 text-primary-fg px-6 py-2 sm:px-8 sm:py-3 rounded-full font-sans font-bold text-sm sm:text-lg    transform -rotate-12 border-2 sm:border-4 border-primary-fg">
                  Claimed
                </div>
              </div>
            )}
          </div>

          {/* Content Section */}
          <div className="md:w-1/2 p-6 sm:p-8 md:p-12 overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-sans font-bold text-primary mb-2">{item.title}</h2>
                <div className="flex items-center text-[10px] sm:text-sm text-muted">
                  <span className="bg-surface-raised px-2 py-1 rounded text-[9px] sm:text-[10px] font-bold  tracking-wider mr-3">
                    ID: {item.id.slice(-6)}
                  </span>
                  <span>Reported on {new Date(item.date).toLocaleDateString()}</span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-surface-raised rounded-full transition-colors text-muted hover:text-muted"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-8">
              {/* Description */}
              <div>
                <h3 className="text-xs font-bold text-muted   mb-3">Description</h3>
                <p className="text-fg leading-relaxed">
                  {item.description}
                </p>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-6">
                <div className="flex items-start">
                  <div className="p-2 bg-primary/5 rounded-lg mr-3 text-primary">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold text-muted   mb-0.5">Location</h4>
                    <p className="text-sm font-medium text-fg">{item.location}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="p-2 bg-accent/5 rounded-lg mr-3 text-accent">
                    <Tag size={18} />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold text-muted   mb-0.5">Category</h4>
                    <p className="text-sm font-medium text-fg">{item.category}</p>
                  </div>
                </div>
                {item.type === 'found' && item.currentPossession && (
                  <div className="flex items-start">
                    <div className="p-2 bg-amber-50 rounded-lg mr-3 text-amber-600">
                      <AlertCircle size={18} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-bold text-muted   mb-0.5">Current Location</h4>
                        {(currentUser?.id === item.reporterId || currentUser?.role === 'admin') && onUpdateItem && (
                          <button 
                            onClick={() => onUpdateItem(item.id, { 
                              currentPossession: item.currentPossession === 'reporter' ? 'csc-office' : 'reporter' 
                            })}
                            className="text-[10px] font-bold text-primary hover:underline"
                          >
                            Change
                          </button>
                        )}
                      </div>
                      <p className="text-sm font-medium text-fg">
                        {item.currentPossession === 'reporter' ? 'With the Finder' : 'CSC Office'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Reference ID Section */}
              <div className="p-4 bg-bg rounded-2xl border ring-border flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <div className="p-2 bg-surface rounded-lg shadow-sm mr-3">
                    <Tag size={18} className="text-primary" />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold text-muted   mb-0.5">Item Reference ID</h4>
                    <p className="text-sm font-mono font-bold text-fg">{item.id}</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(item.id);
                  }}
                  className="text-primary hover:text-primary/70 transition-colors"
                  title="Copy ID"
                >
                  <Tag size={16} />
                </button>
              </div>

              {/* Reporter Info */}
              {reporter && (
                <div className="p-4 bg-bg rounded-2xl border ring-border flex items-center">
                  <img src={reporter.avatar} alt="" className="w-10 h-10 rounded-full mr-4 object-cover" referrerPolicy="no-referrer" />
                  <div>
                    <h4 className="text-[10px] font-bold text-muted   mb-0.5">Reported By</h4>
                    <p className="text-sm font-bold text-fg">{reporter.name}</p>
                    <p className="text-[10px] text-muted">{reporter.email}</p>
                  </div>
                </div>
              )}

              {/* Claim Form */}
              {showClaimForm && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="p-6 bg-primary/5 rounded-2xl border border-primary/10"
                >
                  <h4 className="font-bold text-primary mb-4">Submit Claim</h4>
                  <form onSubmit={handleClaimSubmit}>
                    <textarea
                      required
                      placeholder={item.status === 'found' ? "Provide some details to prove this is yours (e.g. unique marks, what's inside)..." : "Where did you find it? Any additional details?"}
                      className="w-full p-4 rounded-xl border ring-border focus:outline-none focus:ring-2 focus:ring-primary/20 mb-4 text-sm"
                      rows={3}
                      value={claimMessage}
                      onChange={(e) => setClaimMessage(e.target.value)}
                    />
                    
                    <div className="mb-6 space-y-2">
                      <h5 className="text-[10px] font-bold text-muted   mb-1">Photo Proof (Optional)</h5>
                      <div className={`relative w-full rounded-xl overflow-hidden border transition-all ${
                        uploadError ? 'border-red-300 bg-red-50/10' : 'ring-border'
                      }`}>
                        {proofImageUrl ? (
                          <div className="relative w-full h-40">
                            <img src={proofImageUrl} alt="Proof" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            {!isUploading && (
                              <button 
                                type="button"
                                onClick={() => setProofImageUrl('')}
                                className="absolute top-2 right-2 p-1.5 bg-black/60 text-primary-fg rounded-full hover:bg-black/80 transition-colors"
                              >
                                <X size={14} />
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="relative w-full py-8 border-2 border-dashed border-transparent flex flex-col items-center justify-center text-muted hover:text-primary transition-all group overflow-hidden">
                            <input 
                              type="file" 
                              accept="image/*" 
                              disabled={isUploading}
                              className="absolute inset-0 opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed" 
                              onChange={handleProofFileChange}
                            />
                            <Camera size={24} className="mb-2 group-hover:scale-110 transition-transform" />
                            <span className="text-xs font-bold">Upload Photo Proof</span>
                          </div>
                        )}

                        {/* Loader overlay inside container */}
                        {isUploading && (
                          <div className="absolute inset-0 bg-slate-900/80  flex flex-col items-center justify-center text-center p-3 z-20">
                            <div className="w-8 h-8 rounded-full border-3 border-primary-fg/20 border-t-primary animate-spin mb-2"></div>
                            <p className="text-primary-fg font-bold text-[10px]   mb-1">Uploading proof...</p>
                            <div className="w-full max-w-xs bg-surface/20 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className="bg-primary h-full transition-all duration-300" 
                                style={{ width: `${uploadProgress}%` }}
                              />
                            </div>
                            <p className="text-primary-fg text-[9px] font-mono mt-0.5">{uploadProgress}%</p>
                          </div>
                        )}
                      </div>

                      {/* Explicit Error Messages */}
                      {uploadError && (
                        <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-xl border border-red-100 animate-in fade-in duration-300">
                          <AlertCircle size={14} className="flex-shrink-0" />
                          <span className="text-xs font-medium">{uploadError}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <button 
                        type="submit" 
                        disabled={isUploading} 
                        className={`btn-primary py-2 px-6 text-sm flex items-center space-x-2 ${
                          isUploading ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {isUploading ? (
                          <>
                            <span className="w-3.5 h-3.5 rounded-full border-2 border-primary-fg/25 border-t-white animate-spin"></span>
                            <span>Uploading...</span>
                          </>
                        ) : (
                          <span>Submit Claim</span>
                        )}
                      </button>
                      <button 
                        type="button" 
                        disabled={isUploading} 
                        onClick={() => {
                          setShowClaimForm(false);
                          setUploadError(null);
                        }} 
                        className="px-6 py-2 text-sm text-muted hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              {/* Action Buttons */}
              {!showClaimForm && (
                <div className="pt-6 border-t ring-border flex flex-col sm:flex-row gap-4">
                  {item.status === 'found' && !isReporter ? (
                    <button 
                      onClick={handleClaimClick}
                      className="flex-grow btn-primary py-4 flex items-center justify-center"
                    >
                      <CheckCircle size={18} className="mr-2" />
                      This is Mine
                    </button>
                  ) : item.status === 'lost' && !isReporter ? (
                    <button 
                      onClick={handleClaimClick}
                      className="flex-grow btn-accent py-4 flex items-center justify-center text-primary-fg"
                    >
                      <AlertCircle size={18} className="mr-2" />
                      I Found This
                    </button>
                  ) : null}
                </div>
              )}

              {/* Comment Section */}
              <CommentSection
                itemId={item.id}
                comments={comments}
                currentUser={currentUser || null}
                onPostComment={(content, parentId) => onPostComment(item.id, content, parentId)}
                onDeleteComment={onDeleteComment}
                onUpdateComment={onUpdateComment}
              />
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
