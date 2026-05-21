import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Camera, Upload, Search, Zap, AlertCircle } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { Item } from '../types';
import { compressImage } from '../lib/imageCompression';

interface ImageSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (query: string) => void;
  items: Item[];
}

export default function ImageSearchModal({ isOpen, onClose, onSearch, items }: ImageSearchModalProps) {
  const [selectedImage, setSelectedImage] = React.useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
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
    }
  };

  const analyzeImage = async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const base64Data = selectedImage.split(',')[1];

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            parts: [
              { text: "Analyze this image of a lost item. Provide a list of 5-10 keywords that describe the item, its color, brand, material, and any related categories (e.g., if it's an iPhone, include 'phone', 'electronics', 'apple', 'smartphone', 'black'). Return ONLY the keywords separated by spaces." },
              { inlineData: { data: base64Data, mimeType: "image/jpeg" } }
            ]
          }
        ]
      });

      const keywords = response.text?.trim();
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
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-primary text-white">
              <div className="flex items-center">
                <Camera className="mr-3 text-accent" size={24} />
                <h2 className="text-xl font-display font-bold">Search by Image</h2>
              </div>
              <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="p-8">
              {!selectedImage ? (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-4 text-slate-400">
                      <Upload size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">Upload a Photo</h3>
                    <p className="text-slate-500 text-sm mb-8">
                      Our AI will analyze the photo to find matching items in our database.
                    </p>
                  </div>

                  <label className="block">
                    <span className="sr-only">Choose photo</span>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="block w-full text-sm text-slate-500
                        file:mr-4 file:py-3 file:px-6
                        file:rounded-xl file:border-0
                        file:text-sm file:font-bold
                        file:bg-primary file:text-white
                        hover:file:bg-primary-dark
                        cursor-pointer"
                    />
                  </label>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="relative aspect-video rounded-2xl overflow-hidden border-2 border-slate-100 shadow-inner bg-slate-50">
                    <img 
                      src={selectedImage} 
                      alt="Selected" 
                      className="w-full h-full object-contain"
                    />
                    <button 
                      onClick={() => setSelectedImage(null)}
                      className="absolute top-3 right-3 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
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
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                        : 'bg-primary text-white shadow-lg shadow-primary/20 hover:scale-[1.02]'
                    }`}
                  >
                    {isAnalyzing ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-slate-400 border-t-transparent mr-3"></div>
                        AI Analyzing Image...
                      </>
                    ) : (
                      <>
                        <Zap size={20} className="mr-2 text-accent" />
                        Identify & Search
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                AI Match Technology Powered by Gemini
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
