import React, { useState } from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { ImageUpload } from './ImageUpload';
import { cn } from '../../utils/cn';

interface LogoUploaderProps {
  currentLogo?: string;
  onUploadSuccess?: (url: string) => void;
  onRemove?: () => void;
  className?: string;
}

export const LogoUploader: React.FC<LogoUploaderProps> = ({
  currentLogo,
  onUploadSuccess,
  onRemove,
  className,
}) => {
  const { showToast } = useToast();
  const [showUpload, setShowUpload] = useState(false);

  const handleUpload = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload/logo', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }

      const data = await response.json();
      return data.data.url;
    } catch (error: any) {
      throw new Error(error.message || 'Logo upload failed');
    }
  };

  const handleSuccess = (url: string) => {
    setShowUpload(false);
    onUploadSuccess?.(url);
  };

  const handleRemove = async () => {
    // In a real implementation, you'd call an API to remove the logo
    onRemove?.();
    showToast('Logo removed', 'success');
  };

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <h3 className="font-semibold text-base">Company Logo</h3>

      <div className="flex gap-4">
        {/* Logo Preview */}
        <div
          className={cn(
            'relative w-28 h-28 rounded-lg overflow-hidden',
            'backdrop-blur-md bg-white/5 border border-white/20',
            'flex items-center justify-center flex-shrink-0',
            'group'
          )}
        >
          {currentLogo ? (
            <>
              <img
                src={currentLogo}
                alt="Logo"
                className="w-full h-full object-cover"
              />
              {/* Overlay with action buttons */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  onClick={() => setShowUpload(true)}
                  className="p-2 rounded-full bg-cyan-500/80 hover:bg-cyan-600 text-white transition-all"
                  title="Change logo"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={handleRemove}
                  className="p-2 rounded-full bg-red-500/80 hover:bg-red-600 text-white transition-all"
                  title="Remove logo"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </>
          ) : (
            <div className="text-center p-4">
              <p className="text-white/50 text-xs">No logo</p>
              <button
                onClick={() => setShowUpload(true)}
                className="mt-2 px-3 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 rounded text-cyan-300 text-xs font-medium transition-all"
              >
                Upload
              </button>
            </div>
          )}
        </div>

        {/* Logo Info */}
        <div className="flex-1 flex flex-col justify-center">
          <p className="text-white/70 text-sm">
            {currentLogo ? 'Your company logo' : 'No logo uploaded yet'}
          </p>
          <p className="text-white/40 text-xs mt-1">
            JPG, PNG, WEBP • Max 5MB
          </p>
          {!currentLogo && (
            <button
              onClick={() => setShowUpload(true)}
              className="mt-3 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 rounded-lg text-white text-sm font-medium transition-all"
            >
              Upload Logo
            </button>
          )}
        </div>
      </div>

      {/* Upload Form */}
      {showUpload && (
        <div className="w-full">
          <ImageUpload
            onUpload={handleUpload}
            onSuccess={handleSuccess}
            onError={() => setShowUpload(false)}
            preview={currentLogo}
            label="Upload Company Logo"
            variant="medium"
            className="p-4 rounded-lg backdrop-blur-md bg-white/5 border border-white/10"
          />
        </div>
      )}
    </div>
  );
};
