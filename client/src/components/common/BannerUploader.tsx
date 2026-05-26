import React, { useState } from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { ImageUpload } from './ImageUpload';
import { cn } from '../../utils/cn';

interface BannerUploaderProps {
  currentBanner?: string;
  onUploadSuccess?: (url: string) => void;
  onRemove?: () => void;
  className?: string;
}

export const BannerUploader: React.FC<BannerUploaderProps> = ({
  currentBanner,
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
      const response = await fetch('/api/upload/banner', {
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
      throw new Error(error.message || 'Banner upload failed');
    }
  };

  const handleSuccess = (url: string) => {
    setShowUpload(false);
    onUploadSuccess?.(url);
  };

  const handleRemove = async () => {
    // In a real implementation, you'd call an API to remove the banner
    onRemove?.();
    showToast('Banner removed', 'success');
  };

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <h3 className="font-semibold text-base">Profile Banner</h3>

      {/* Banner Preview */}
      <div
        className={cn(
          'relative w-full h-40 rounded-lg overflow-hidden',
          'backdrop-blur-md bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-white/20',
          'flex items-center justify-center group'
        )}
      >
        {currentBanner ? (
          <>
            <img
              src={currentBanner}
              alt="Banner"
              className="w-full h-full object-cover"
            />
            {/* Overlay with action buttons */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button
                onClick={() => setShowUpload(true)}
                className="p-3 rounded-full bg-cyan-500/80 hover:bg-cyan-600 text-white transition-all"
                title="Change banner"
              >
                <Edit2 size={20} />
              </button>
              <button
                onClick={handleRemove}
                className="p-3 rounded-full bg-red-500/80 hover:bg-red-600 text-white transition-all"
                title="Remove banner"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </>
        ) : (
          <div className="text-center">
            <p className="text-white/50 text-sm">No banner uploaded</p>
            <button
              onClick={() => setShowUpload(true)}
              className="mt-3 px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 rounded-lg text-cyan-300 text-sm font-medium transition-all"
            >
              Upload Banner
            </button>
          </div>
        )}
      </div>

      {/* Info */}
      <p className="text-white/40 text-xs">
        Recommended: 1200 x 400px • JPG, PNG, WEBP • Max 5MB
      </p>

      {/* Upload Form */}
      {showUpload && (
        <div className="w-full">
          <ImageUpload
            onUpload={handleUpload}
            onSuccess={handleSuccess}
            onError={() => setShowUpload(false)}
            preview={currentBanner}
            label="Upload Profile Banner"
            variant="large"
            className="p-4 rounded-lg backdrop-blur-md bg-white/5 border border-white/10"
          />
        </div>
      )}
    </div>
  );
};
