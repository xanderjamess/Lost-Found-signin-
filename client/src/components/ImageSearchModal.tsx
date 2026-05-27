import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Camera, Upload, Zap, AlertCircle } from 'lucide-react';
import { compressImage } from '../lib/imageCompression';
import { api } from '../lib/api';

interface ImageSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (query: string) => void;
}

export default function ImageSearchModal({ isOpen, onClose, onSearch }: ImageSearchModalProps) {
  const [selectedImage, setSelectedImage] = React.useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await handleFile(file);
  };

  const handleFile = async (file: File) => {
    try {
      const compressed = await compressImage(file);
      setSelectedImage(compressed);
      setError(null);
    } catch (err) {
      console.error('Failed to compress search image:', err);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (file) await handleFile(file);
  };

  const analyzeImage = async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const { keywords } = await api.ai.imageSearch(selectedImage);
      if (keywords) {
        onSearch(keywords);
        onClose();
      } else {
        throw new Error("Could not analyze image");
      }
    } catch (err) {
      console.error("Image analysis failed:", err);
      setError("Failed to analyze image. Please try again or use text search.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 "
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-surface rounded-3xl  max-w-lg w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b ring-border flex justify-between items-center bg-primary text-primary-fg">
              <div className="flex items-center">
                <Camera className="mr-3 text-accent" size={24} />
                <h2 className="text-xl font-sans font-bold">Search by Image</h2>
              </div>
              <button onClick={onClose} className="p-1 hover:bg-surface/10 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="p-8">
              {!selectedImage ? (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-bg rounded-3xl flex items-center justify-center mx-auto mb-4 text-muted">
                      <Upload size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-fg mb-2">Upload a Photo</h3>
                    <p className="text-muted text-sm mb-8">
                      We'll extract keywords and any readable text from the photo to search the database.
                    </p>
                  </div>

                  <label className="block">
                    <span className="sr-only">Choose photo</span>
                    <div
                      onDrop={handleDrop}
                      onDragOver={(e) => e.preventDefault()}
                      className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-300 rounded-2xl cursor-pointer hover:bg-bg/50"
                    >
                      <Upload size={36} className="mb-3 text-muted" />
                      <div className="text-center">
                        <p className="font-bold text-fg">Drag & drop an image here</p>
                        <p className="text-sm text-muted">or click to browse (PNG, JPG)</p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="sr-only"
                      />
                    </div>
                  </label>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="relative aspect-video rounded-2xl overflow-hidden border-2 ring-border shadow-inner bg-bg">
                    <img 
                      src={selectedImage} 
                      alt="Selected" 
                      className="w-full h-full object-contain"
                    />
                    <button 
                      onClick={() => setSelectedImage(null)}
                      className="absolute top-3 right-3 p-2 bg-black/50 text-primary-fg rounded-full hover:bg-black/70 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {error && (
                    <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start text-red-700 text-sm">
                      <AlertCircle size={18} className="mr-3 mt-0.5 flex-shrink-0" />
                      <p>{error}</p>
                    </div>
                  )}

                  <button
                    onClick={analyzeImage}
                    disabled={isAnalyzing}
                    className={`w-full py-4 rounded-xl font-bold flex items-center justify-center transition-all ${
                      isAnalyzing 
                        ? 'bg-slate-100 text-muted cursor-not-allowed' 
                        : 'bg-primary text-primary-fg  shadow-primary/20 hover:scale-[1.02]'
                    }`}
                  >
                    {isAnalyzing ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-slate-400 border-t-transparent mr-3"></div>
                        Extracting keywords...
                      </>
                    ) : (
                      <>
                        <Zap size={20} className="mr-2 text-accent" />
                        Extract & Search
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            <div className="p-6 bg-bg border-t ring-border text-center">
              <p className="text-[10px] font-bold text-muted  ">
                Image-based search uses keyword extraction and OCR to improve matching.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
