import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Camera, X, AlertCircle } from 'lucide-react';
import { ItemStatus, User } from '../types';
import { compressImage } from '../lib/imageCompression';
import { uploadImageToCloudinary } from '../lib/cloudinary';

interface ReportFormProps {
  type: 'lost' | 'found';
  user: User;
  onClose: () => void;
  onSubmit: (data: any) => Promise<boolean>;
}

export default function ReportForm({
  type,
  user,
  onClose,
  onSubmit
}: ReportFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    category: 'Electronics',
    location: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    imageUrl: '',
    currentPossession: 'reporter' as 'reporter' | 'csc-office'
  });

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const categories = [
    'Electronics',
    'Personal Items',
    'Accessories',
    'Books',
    'Clothing',
    'Other'
  ];

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null);

    let base64ToUpload = '';

    try {
      base64ToUpload = await compressImage(file);

      // instant preview
      setFormData((prev) => ({
        ...prev,
        imageUrl: base64ToUpload
      }));

      const secureUrl = await uploadImageToCloudinary(
        base64ToUpload,
        (progress) => {
          setUploadProgress(progress);
        }
      );

      setFormData((prev) => ({
        ...prev,
        imageUrl: secureUrl
      }));
    } catch (err: any) {
      console.error(err);
      setUploadError(
        err?.message || 'Failed to upload image.'
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    setSubmitError(null);

    if (!formData.imageUrl) {
      setSubmitError(
        'Please upload an image before submitting.'
      );
      return;
    }

    if (isUploading) return;

    const submissionData = {
      ...formData,
      status: 'pending' as ItemStatus,
      type,
      date: new Date(formData.date).toISOString()
    };

    if (type === 'lost') {
      delete (submissionData as any).currentPossession;
    }

    (async () => {
      setIsSubmitting(true);

      try {
        await onSubmit(submissionData);
      } catch (err: any) {
        setSubmitError(
          err?.message || 'Failed to submit report.'
        );
      } finally {
        setIsSubmitting(false);
      }
    })();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-0 sm:p-4">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="bg-surface w-full max-w-2xl h-full sm:h-auto sm:max-h-[90vh] overflow-y-auto sm:rounded-3xl p-6 sm:p-8"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-8 border-b border-border pb-4">
          <div className="flex items-center gap-4">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-12 h-12 rounded-full object-cover border-2 border-primary/20"
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
            />

            <div>
              <p className="text-[10px] font-bold text-muted mb-1">
                Reporting as {user.name}
              </p>

              <h2 className="text-2xl font-bold text-fg">
                Report{' '}
                <span
                  className={
                    type === 'lost'
                      ? 'text-red-500'
                      : 'text-primary'
                  }
                >
                  {type.charAt(0).toUpperCase() +
                    type.slice(1)}
                </span>{' '}
                Item
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          {/* Item + Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-bold text-muted mb-2 block">
                Item Name
              </label>

              <input
                type="text"
                required
                placeholder="e.g. Blue Hydro Flask"
                className="input-field"
                value={formData.title}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    title: e.target.value
                  })
                }
              />
            </div>

            <div>
              <label className="text-xs font-bold text-muted mb-2 block">
                Category
              </label>

              <select
                required
                className="input-field"
                value={formData.category}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    category: e.target.value
                  })
                }
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Location + Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-bold text-muted mb-2 block">
                Location
              </label>

              <input
                type="text"
                required
                placeholder="e.g. Main Library"
                className="input-field"
                value={formData.location}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    location: e.target.value
                  })
                }
              />
            </div>

            <div>
              <label className="text-xs font-bold text-muted mb-2 block">
                Date
              </label>

              <input
                type="date"
                required
                className="input-field"
                value={formData.date}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    date: e.target.value
                  })
                }
              />
            </div>
          </div>

          {/* Possession */}
          {type === 'found' && (
            <div>
              <label className="text-xs font-bold text-muted mb-3 block">
                Where is the item now?
              </label>

              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      currentPossession: 'reporter'
                    })
                  }
                  className={`p-4 rounded-2xl border-2 text-left transition ${
                    formData.currentPossession ===
                    'reporter'
                      ? 'border-primary bg-primary/5 ring-4 ring-primary/10'
                      : 'border-border hover:border-slate-300'
                  }`}
                >
                  <p className="font-bold text-sm mb-1">
                    I have it
                  </p>

                  <p className="text-[10px] text-muted">
                    In my possession
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      currentPossession: 'csc-office'
                    })
                  }
                  className={`p-4 rounded-2xl border-2 text-left transition ${
                    formData.currentPossession ===
                    'csc-office'
                      ? 'border-primary bg-primary/5 ring-4 ring-primary/10'
                      : 'border-border hover:border-slate-300'
                  }`}
                >
                  <p className="font-bold text-sm mb-1">
                    CSC Office
                  </p>

                  <p className="text-[10px] text-muted">
                    Surrendered to office
                  </p>
                </button>
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="text-xs font-bold text-muted mb-2 block">
              Description
            </label>

            <textarea
              required
              rows={4}
              placeholder="Describe the item..."
              className="input-field resize-none"
              value={formData.description}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  description: e.target.value
                })
              }
            />
          </div>

          {/* IMAGE UPLOAD */}
          <div className="space-y-3">
            <div
              className={`rounded-3xl border-2 border-dashed relative overflow-hidden transition-all min-h-[280px] ${
                uploadError
                  ? 'border-red-300 bg-red-50/10'
                  : 'border-border hover:border-slate-400'
              }`}
            >
              <input
                type="file"
                accept="image/*"
                disabled={isUploading}
                className="absolute inset-0 opacity-0 cursor-pointer z-20"
                onChange={handleFileChange}
              />

              {formData.imageUrl ? (
                <div className="relative w-full h-[280px] bg-black">
                  <img
                    src={formData.imageUrl}
                    alt="Preview"
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />

                  <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition flex items-center justify-center">
                    <p className="text-white font-bold text-sm">
                      Change Photo
                    </p>
                  </div>
                </div>
              ) : (
                <div className="h-[280px] flex flex-col items-center justify-center text-center">
                  <Camera
                    size={36}
                    className="text-muted mb-3"
                  />

                  <p className="text-sm font-bold text-muted mb-4">
                    Upload Image
                  </p>

                  <div className="btn-muted px-6 py-2 text-sm">
                    Choose File
                  </div>
                </div>
              )}

              {/* Upload Overlay */}
              {isUploading && (
                <div className="absolute inset-0 z-30 bg-slate-900/80 flex flex-col items-center justify-center p-6">
                  <div className="w-10 h-10 rounded-full border-4 border-white/20 border-t-white animate-spin mb-4"></div>

                  <p className="text-white font-bold text-sm mb-3">
                    Uploading to Cloudinary
                  </p>

                  <div className="w-full max-w-xs bg-white/20 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-primary h-full transition-all duration-300"
                      style={{
                        width: `${uploadProgress}%`
                      }}
                    />
                  </div>

                  <p className="text-white text-xs font-mono mt-2">
                    {uploadProgress}%
                  </p>
                </div>
              )}
            </div>

            {/* Upload Error */}
            {uploadError && (
              <div className="flex items-center gap-2 p-3 rounded-2xl border border-red-200 bg-red-50 text-red-600">
                <AlertCircle size={16} />

                <span className="text-xs font-medium">
                  {uploadError}
                </span>
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-4 pt-4 sticky bottom-0 bg-surface pb-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading || isSubmitting}
              className="flex-1 btn-muted py-4 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isUploading || isSubmitting}
              className={`flex-1 py-4 rounded-2xl font-semibold text-white transition flex items-center justify-center gap-2 ${
                type === 'lost'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-primary hover:bg-primary/90'
              } ${
                (isUploading || isSubmitting) &&
                'opacity-50 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin"></span>
                  <span>Submitting...</span>
                </>
              ) : isUploading ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin"></span>
                  <span>
                    Uploading {uploadProgress}%
                  </span>
                </>
              ) : (
                <span>Submit Report</span>
              )}
            </button>
          </div>

          {/* Submit Error */}
          {submitError && (
            <div className="p-3 rounded-2xl bg-red-50 text-red-600 text-sm font-medium">
              {submitError}
            </div>
          )}
        </form>
      </motion.div>
    </div>
  );
}