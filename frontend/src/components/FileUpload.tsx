'use client';

import React, { useRef, useState } from 'react';
import { UploadCloud, Image as ImageIcon, X, CheckCircle2, Sparkles } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File | null) => void;
  selectedFile: File | null;
  previewUrl: string | null;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  selectedFile,
  previewUrl,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      validateAndSetFile(file);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file: File) => {
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a valid image file (PNG, JPG, WEBP, GIF)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds 5MB limit. Please choose a smaller image.');
      return;
    }

    onFileSelect(file);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider">
          Token Logo <span className="text-neutral-500 font-normal lowercase">(PNG, JPG, WEBP)</span>
        </label>
        {selectedFile && (
          <span className="flex items-center text-xs text-[#14F195] font-mono">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            {(selectedFile.size / 1024).toFixed(1)} KB
          </span>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
        className="hidden"
        onChange={handleInputChange}
      />

      {previewUrl ? (
        <div className="relative group/preview border border-white/[0.12] bg-[#05070f]/80 rounded-2xl p-4 flex items-center justify-between transition-all duration-300 hover:border-purple-500/50 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
          <div className="flex items-center space-x-4">
            <div className="relative w-16 h-16 rounded-2xl overflow-hidden border border-white/[0.15] bg-black shadow-inner flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Token Logo Preview"
                className="w-full h-full object-cover group-hover/preview:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white truncate max-w-[200px] sm:max-w-[280px]">
                {selectedFile?.name || 'Selected Logo'}
              </p>
              <p className="text-xs text-neutral-400 mt-0.5 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#14F195]" />
                Pinned to IPFS Decentralized Storage
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs font-medium bg-white/[0.05] hover:bg-white/[0.1] text-neutral-200 px-3.5 py-1.5 rounded-full border border-white/[0.1] transition-all duration-200 active:scale-95"
            >
              Change
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="p-1.5 text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-full transition-all duration-200"
              title="Remove image"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border border-dashed rounded-xl py-3 px-4 text-center cursor-pointer relative overflow-hidden group ${
            isDragging
              ? 'border-[#14F195] bg-[#14F195]/5 shadow-[0_0_30px_rgba(20,241,149,0.15)]'
              : 'border-white/[0.1] hover:border-purple-500/40 bg-white/[0.02] hover:bg-white/[0.04]'
          }`}
        >
          <div className="relative z-10 flex flex-col items-center justify-center space-y-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-neutral-400">
              <UploadCloud className="w-5 h-5 text-[#9945FF]" />
            </div>
            <div className="text-xs text-neutral-300">
              <span className="font-semibold text-purple-400 group-hover:text-[#14F195] transition-colors duration-300">
                Click to browse
              </span>{' '}
              or drag & drop logo
            </div>
            <p className="text-[11px] text-neutral-500">
              Recommended: 500×500px square PNG or WebP with transparent background (Max 5MB)
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
