import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, X, AlertCircle } from 'lucide-react';
import { ItemStatus, User } from '../types';
import { compressImage } from '../lib/imageCompression';
import { uploadImageToCloudinary } from '../lib/cloudinary';

interface ReportFormProps {
  type: 'lost' | 'found';
  user: User;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export default function ReportForm({ type, user, onClose, onSubmit }: ReportFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    category: 'Electronics',
    location: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    imageUrl: 'https://picsum.photos/seed/item/400/300',
    currentPossession: 'reporter' as 'reporter' | 'csc-office'
  });

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const categories = ['Electronics', 'Personal Items', 'Accessories', 'Books', 'Clothing', 'Other'];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      setUploadProgress(0);
      setUploadError(null);
      
      let base64ToUpload = '';
      try {
        base64ToUpload = await compressImage(file);
      } catch (err) {
        console.error('Failed to compress image:', err);
        // Fallback to reading file normally if compression fails
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

      // Pre-populate with local base64 for instant feedback
      setFormData(prev => ({ ...prev, imageUrl: base64ToUpload }));

      // Send to backend Cloudinary service
      try {
        const secureUrl = await uploadImageToCloudinary(base64ToUpload, (progress) => {
          setUploadProgress(progress);
        });
        setFormData(prev => ({ ...prev, imageUrl: secureUrl }));
        setIsUploading(false);
      } catch (uploadErr: any) {
        console.error('Failed to upload image to Cloudinary:', uploadErr);
        setUploadError(uploadErr.message || 'Image upload failed. Cloudinary credentials may be missing.');
        setIsUploading(false);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submissionData = {
      ...formData,
      status: 'pending' as ItemStatus,
      type: type,
      id: Math.random().toString(36).substr(2, 9),
      date: new Date(formData.date).toISOString()
    };

    // Only include currentPossession for found items
    if (type === 'lost') {
      delete (submissionData as any).currentPossession;
    }

    onSubmit(submissionData);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="bg-white p-6 sm:p-8 w-full max-w-2xl relative overflow-y-auto h-full sm:h-auto sm:max-h-[90vh] sm:rounded-3xl shadow-2xl"
      >
        <div className="flex justify-between items-center mb-6 sm:mb-8 border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-4">
            <img 
              src={user.avatar} 
              alt={user.name} 
              className="w-12 h-12 rounded-full border-2 border-primary/20"
              referrerPolicy="no-referrer"
            />
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Reporting as {user.name}</p>
              <h2 className="text-2xl font-bold text-slate-900">
                Report <span className={type === 'lost' ? 'text-red-500' : 'text-primary'}>{type.charAt(0).toUpperCase() + type.slice(1)}</span> Item
              </h2>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Item Name</label>
              <input
                type="text"
                required
                placeholder="e.g., Blue Hydro Flask"
                className="input-field"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Category</label>
              <select
                required
                className="input-field"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Location</label>
              <input
                type="text"
                required
                placeholder="e.g., Main Library, Level 3"
                className="input-field"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Date</label>
              <input
                type="date"
                required
                className="input-field"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
          </div>

          {type === 'found' && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-500">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 block">Where is the item now?</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, currentPossession: 'reporter' })}
                  className={`p-4 rounded-2xl border-2 transition-all text-left group ${
                    formData.currentPossession === 'reporter' 
                      ? 'border-primary bg-primary/5 ring-4 ring-primary/10' 
                      : 'border-slate-100 bg-white hover:border-slate-200'
                  }`}
                >
                  <p className={`font-bold text-sm mb-1 transition-colors ${formData.currentPossession === 'reporter' ? 'text-primary' : 'text-slate-900'}`}>I have it</p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">In my possession</p>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, currentPossession: 'csc-office' })}
                  className={`p-4 rounded-2xl border-2 transition-all text-left group ${
                    formData.currentPossession === 'csc-office' 
                      ? 'border-primary bg-primary/5 ring-4 ring-primary/10' 
                      : 'border-slate-100 bg-white hover:border-slate-200'
                  }`}
                >
                  <p className={`font-bold text-sm mb-1 transition-colors ${formData.currentPossession === 'csc-office' ? 'text-primary' : 'text-slate-900'}`}>CSC Office</p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Surrendered to office</p>
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Description</label>
            <textarea
              required
              rows={4}
              placeholder="Provide a detailed description of the item..."
              className="input-field resize-none"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            ></textarea>
          </div>

          <div className="space-y-3">
            <div className={`p-8 bg-slate-50 rounded-2xl border-2 border-dashed relative group overflow-hidden transition-all ${
              uploadError ? 'border-red-300 bg-red-50/10' : 'border-slate-200 hover:border-slate-300'
            }`}>
              <input 
                type="file" 
                accept="image/*" 
                disabled={isUploading}
                className="absolute inset-0 opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed" 
                onChange={handleFileChange}
              />
              {formData.imageUrl && !formData.imageUrl.includes('picsum.photos') ? (
                <div className="absolute inset-0">
                  <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <p className="text-white font-bold text-xs uppercase tracking-widest">Change Photo</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center">
                  <Camera size={32} className="text-slate-300 mb-2" />
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Upload Image</p>
                  <div className="btn-secondary text-xs px-6 py-2">
                    Choose File
                  </div>
                </div>
              )}

              {/* Dynamic Progress Overlay */}
              {isUploading && (
                <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xs flex flex-col items-center justify-center text-center p-4 z-20">
                  <div className="w-10 h-10 rounded-full border-4 border-white/20 border-t-primary animate-spin mb-3"></div>
                  <p className="text-white font-bold text-xs uppercase tracking-widest mb-2">Uploading to Cloudinary</p>
                  <div className="w-full max-w-xs bg-white/20 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-primary h-full transition-all duration-300" 
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-white text-[10px] font-mono mt-1">{uploadProgress}%</p>
                </div>
              )}
            </div>

            {/* Error Message */}
            {uploadError && (
              <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-2xl border border-red-100 animate-in fade-in duration-350">
                <AlertCircle size={16} className="flex-shrink-0" />
                <span className="text-xs font-medium">{uploadError}</span>
              </div>
            )}
          </div>

          <div className="flex gap-4 pt-4 sticky bottom-0 bg-white pb-2 sm:pb-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="flex-1 btn-secondary py-3 sm:py-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className={`flex-1 btn-primary py-3 sm:py-4 flex items-center justify-center space-x-2 ${
                isUploading ? 'opacity-50 cursor-not-allowed' : ''
              } ${
                type === 'lost' ? 'bg-red-600 hover:bg-red-700 shadow-red-200' : 'bg-primary hover:bg-primary/95'
              }`}
            >
              {isUploading ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin"></span>
                  <span>Uploading {uploadProgress}%</span>
                </>
              ) : (
                <span>Submit Report</span>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
