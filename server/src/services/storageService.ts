import { v2 as cloudinary } from 'cloudinary';
import { promises as fs } from 'fs';
import { join } from 'path';
import { logger } from '../config/logger';

// Initialize Cloudinary if credentials are available
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

const UPLOADS_DIR = join(process.cwd(), 'uploads');

interface UploadResult {
  url: string;
  publicId?: string;
  isLocal: boolean;
}

class StorageService {
  private isCloudinaryAvailable(): boolean {
    return !!(
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    );
  }

  private async ensureUploadsDir(): Promise<void> {
    try {
      await fs.mkdir(UPLOADS_DIR, { recursive: true });
    } catch (error) {
      logger.error(`Failed to create uploads directory: ${error}`);
    }
  }

  async uploadToCloudinary(
    file: Express.Multer.File,
    folder: 'avatars' | 'logos' | 'banners'
  ): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `aetherglow/${folder}`,
          resource_type: 'auto',
          allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'tiff', 'avif', 'svg'],
          max_bytes: 5 * 1024 * 1024, // 5MB
          quality: 'auto:good',
        },
        (error, result) => {
          if (error) {
            logger.error(`Cloudinary upload error: ${error.message}`);
            reject(new Error(`Upload failed: ${error.message}`));
          } else if (result) {
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
              isLocal: false,
            });
          }
        }
      );

      uploadStream.end(file.buffer);
    });
  }

  async uploadToLocal(
    file: Express.Multer.File,
    folder: 'avatars' | 'logos' | 'banners',
    userId: string
  ): Promise<UploadResult> {
    try {
      await this.ensureUploadsDir();

      // Create folder structure
      const folderPath = join(UPLOADS_DIR, folder);
      await fs.mkdir(folderPath, { recursive: true });

      // Generate unique filename
      const timestamp = Date.now();
      const filename = `${userId}-${timestamp}-${file.originalname}`;
      const filepath = join(folderPath, filename);

      // Write file
      await fs.writeFile(filepath, file.buffer);

      // Return URL path (relative to server)
      const url = `/uploads/${folder}/${filename}`;

      logger.info(`File uploaded locally: ${url}`);

      return {
        url,
        isLocal: true,
      };
    } catch (error) {
      logger.error(`Local upload error: ${error}`);
      throw new Error(`Local upload failed: ${error}`);
    }
  }

  async upload(
    file: Express.Multer.File,
    folder: 'avatars' | 'logos' | 'banners',
    userId: string
  ): Promise<UploadResult> {
    // Validate file
    if (!file) {
      throw new Error('No file provided');
    }

    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/bmp',
      'image/tiff',
      'image/avif',
      'image/svg+xml',
    ];
    if (!allowedMimes.includes(file.mimetype)) {
      throw new Error('Invalid file type. Only image files are allowed');
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new Error('File size exceeds 5MB limit');
    }

    // Try Cloudinary first, fallback to local storage
    if (this.isCloudinaryAvailable()) {
      try {
        logger.info(`Uploading to Cloudinary: ${file.originalname}`);
        return await this.uploadToCloudinary(file, folder);
      } catch (error) {
        logger.warn(`Cloudinary upload failed, falling back to local storage: ${error}`);
        return await this.uploadToLocal(file, folder, userId);
      }
    } else {
      logger.info(`Cloudinary not configured, using local storage`);
      return await this.uploadToLocal(file, folder, userId);
    }
  }

  async deleteCloudinary(publicId: string): Promise<void> {
    if (!this.isCloudinaryAvailable()) return;

    try {
      await cloudinary.uploader.destroy(publicId);
      logger.info(`Deleted from Cloudinary: ${publicId}`);
    } catch (error) {
      logger.error(`Failed to delete from Cloudinary: ${error}`);
    }
  }

  async deleteLocal(url: string): Promise<void> {
    try {
      // Extract filename from URL
      const filename = url.replace('/uploads/', '');
      const filepath = join(UPLOADS_DIR, filename);

      await fs.unlink(filepath);
      logger.info(`Deleted local file: ${filepath}`);
    } catch (error) {
      logger.error(`Failed to delete local file: ${error}`);
    }
  }

  async delete(url: string, publicId?: string): Promise<void> {
    if (publicId && this.isCloudinaryAvailable()) {
      await this.deleteCloudinary(publicId);
    } else if (url.startsWith('/uploads/')) {
      await this.deleteLocal(url);
    }
  }
}

export const storageService = new StorageService();
