import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

const ImageUploader = ({ onImageSelected, resetKey }) => {
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  React.useEffect(() => {
    if (resetKey) {
      setPreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [resetKey]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      onImageSelected(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      onImageSelected(file);
    }
  };

  const clearImage = () => {
    setPreviewUrl(null);
    onImageSelected(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full">
      {previewUrl ? (
        <div className="relative rounded-xl border border-slate-800 overflow-hidden bg-slate-900 aspect-video flex items-center justify-center group shadow-inner">
          <img 
            src={previewUrl} 
            alt="Report Preview" 
            className="max-h-full max-w-full object-contain"
          />
          <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <button
              type="button"
              onClick={clearImage}
              className="p-3 bg-red-500 hover:bg-red-600 text-white rounded-full transition-transform active:scale-90 shadow-lg"
              title="Remove Image"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-800 hover:border-brand-500/50 bg-slate-900/30 hover:bg-brand-500/5 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 group aspect-video"
        >
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl mb-4 group-hover:scale-105 group-hover:border-brand-500/30 group-hover:bg-brand-500/10 text-slate-400 group-hover:text-brand-400 transition-all">
            <Upload className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-slate-200 mb-1 group-hover:text-brand-300 transition-colors">
            Click to upload or drag & drop
          </p>
          <p className="text-xs text-slate-500">
            Supports PNG, JPG, JPEG, WEBP or GIF (max 10MB)
          </p>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
