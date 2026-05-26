import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useToast } from '../../context/ToastContext';

interface ImageUploadProps {
  onUpload: (file: File) => Promise<string>;
  onSuccess?: (url: string) => void;
  onError?: (error: string) => void;
  preview?: string;
  label?: string;
  maxSize?: number; // in bytes, default 5MB
  className?: string;
  variant?: 'small' | 'medium' | 'large';
}

const SIZE_LIMITS = {
  small: { bytes: 5 * 1024 * 1024, text: '5MB' },
  medium: { bytes: 5 * 1024 * 1024, text: '5MB' },
  large: { bytes: 5 * 1024 * 1024, text: '5MB' },
};

export const ImageUpload: React.FC<ImageUploadProps> = ({
  onUpload,
  onSuccess,
  onError,
  preview,
  label = 'Upload Image',
  maxSize,
  className,
  variant = 'medium',
}) => {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>(preview || '');
  const sizeLimit = maxSize || SIZE_LIMITS[variant].bytes;

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) {
        const errorMsg = 'Only JPG, PNG, and WEBP images are allowed';
        showToast(errorMsg, 'error');
        onError?.(errorMsg);
        return;
      }

      const file = acceptedFiles[0];

      // Validate file size
      if (file.size > sizeLimit) {
        const errorMsg = `File size must be less than ${SIZE_LIMITS[variant].text}`;
        showToast(errorMsg, 'error');
        onError?.(errorMsg);
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload file
      setIsLoading(true);
      try {
        const url = await onUpload(file);
        showToast('Image uploaded successfully!', 'success');
        onSuccess?.(url);
      } catch (error: any) {
        const errorMsg = error.message || 'Upload failed';
        showToast(errorMsg, 'error');
        onError?.(errorMsg);
        setPreviewUrl(preview || '');
      } finally {
        setIsLoading(false);
      }
    },
    [onUpload, onSuccess, onError, sizeLimit, variant, preview, showToast]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.gif', '.bmp', '.tiff', '.avif', '.svg'],
    },
    maxFiles: 1,
    disabled: isLoading,
  });

  const handleClear = () => {
    setPreviewUrl('');
  };

  const sizeMap = {
    small: 'w-24 h-24',
    medium: 'w-40 h-40',
    large: 'w-64 h-64',
  };

  const labelMap = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg',
  };

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {label && <h3 className={cn('font-semibold', labelMap[variant])}>{label}</h3>}

      {/* Preview */}
      {previewUrl && (
        <div className={cn('relative rounded-lg overflow-hidden', sizeMap[variant])}>
          <img
            src={previewUrl}
            alt="Preview"
            className="w-full h-full object-cover"
          />
          {!isLoading && (
            <button
              onClick={handleClear}
              className="absolute top-2 right-2 bg-red-500/80 hover:bg-red-600 backdrop-blur-md p-1 rounded-full text-white transition-all"
              title="Remove image"
            >
              <X size={16} />
            </button>
          )}
          {isLoading && (
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          )}
        </div>
      )}

      {/* Upload Zone */}
      {!previewUrl && (
        <div
          {...getRootProps()}
          className={cn(
            'relative rounded-xl border-2 border-dashed transition-all cursor-pointer',
            'backdrop-blur-md bg-white/5 hover:bg-white/10',
            'flex flex-col items-center justify-center gap-3 p-8',
            sizeMap[variant],
            isDragActive
              ? 'border-cyan-400 bg-cyan-400/10'
              : 'border-white/20 hover:border-cyan-300/50',
            isLoading && 'opacity-50 cursor-not-allowed'
          )}
        >
          <input {...getInputProps()} />

          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
              <p className="text-white/60 text-sm">Uploading...</p>
            </>
          ) : (
            <>
              <Upload className="w-8 h-8 text-cyan-400" />
              <div className="text-center">
                <p className="text-white font-medium">
                  {isDragActive ? 'Drop your image here' : 'Drag & drop your image'}
                </p>
                <p className="text-white/50 text-xs mt-1">or click to select</p>
              </div>
              <p className="text-white/40 text-xs">
                Any image type (JPG, PNG, WEBP, GIF, BMP, TIFF, AVIF, SVG) • Max {SIZE_LIMITS[variant].text}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
};
