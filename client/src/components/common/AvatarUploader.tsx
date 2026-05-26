import React, { useState } from 'react';
import { Camera } from 'lucide-react';
import { ImageUpload } from './ImageUpload';
import { cn } from '../../utils/cn';

interface AvatarUploaderProps {
  currentAvatar?: string;
  onUploadSuccess?: (url: string) => void;
  className?: string;
  size?: 'small' | 'medium' | 'large';
}

export const AvatarUploader: React.FC<AvatarUploaderProps> = ({
  currentAvatar,
  onUploadSuccess,
  className,
  size = 'medium',
}) => {
  const [showUpload, setShowUpload] = useState(false);

  const handleUpload = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload/avatar', {
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
      throw new Error(error.message || 'Avatar upload failed');
    }
  };

  const handleSuccess = (url: string) => {
    setShowUpload(false);
    onUploadSuccess?.(url);
  };

  const sizeMap = {
    small: 'w-20 h-20',
    medium: 'w-32 h-32',
    large: 'w-48 h-48',
  };

  const iconSize = size === 'small' ? 'w-5 h-5' : size === 'medium' ? 'w-6 h-6' : 'w-8 h-8';

  return (
    <div className={cn('flex flex-col items-center gap-4', className)}>
      <div className="relative group">
        {/* Avatar Image */}
        <div
          className={cn(
            'relative rounded-full overflow-hidden border-2 border-white/20',
            'backdrop-blur-md bg-gradient-to-br from-cyan-500/20 to-purple-500/20',
            'flex items-center justify-center',
            sizeMap[size]
          )}
        >
          {currentAvatar ? (
            <img
              src={currentAvatar}
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-cyan-400 to-purple-500 opacity-20" />
          )}
        </div>

        {/* Upload Button */}
        <button
          onClick={() => setShowUpload(!showUpload)}
          className={cn(
            'absolute bottom-0 right-0 rounded-full p-2',
            'backdrop-blur-md bg-cyan-500/80 hover:bg-cyan-600',
            'border border-white/30 text-white transition-all',
            'flex items-center justify-center',
            'hover:scale-110'
          )}
          title="Change avatar"
        >
          <Camera className={iconSize} />
        </button>
      </div>

      {/* Upload Form */}
      {showUpload && (
        <div className="w-full max-w-sm">
          <ImageUpload
            onUpload={handleUpload}
            onSuccess={handleSuccess}
            onError={() => setShowUpload(false)}
            preview={currentAvatar}
            label="Upload Profile Picture"
            variant="medium"
            className="p-4 rounded-lg backdrop-blur-md bg-white/5 border border-white/10"
          />
        </div>
      )}
    </div>
  );
};
