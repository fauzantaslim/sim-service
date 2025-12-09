import fileUpload from 'express-fileupload';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import { nanoid } from 'nanoid';

/**
 * Konfigurasi express-fileupload middleware
 */
export const fileUploadMiddleware = fileUpload({
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  abortOnLimit: true,
  responseOnLimit: 'File size limit exceeded. Maximum file size is 5MB.'
});

/**
 * Process dan simpan image dengan sharp
 * Resize dan convert ke WebP format
 */
export async function processAndSaveImage(
  fileBuffer: Buffer,
  uploadDir: string = 'uploads',
  subDir: string = 'sim'
): Promise<string> {
  const fullDir = `${uploadDir}/${subDir}`;
  // Pastikan direktori upload ada
  const fullUploadPath = path.join(process.cwd(), fullDir);
  if (!fs.existsSync(fullUploadPath)) {
    fs.mkdirSync(fullUploadPath, { recursive: true });
  }

  // Generate unique filename
  const filename = `${nanoid()}.webp`;
  const filepath = path.join(fullUploadPath, filename);

  // Process image: resize dan convert ke WebP
  await sharp(fileBuffer)
    .resize(800, 1200, {
      fit: 'inside',
      withoutEnlargement: true
    })
    .webp({ quality: 80 })
    .toFile(filepath);

  // Return relative path untuk disimpan di database
  return `${fullDir}/${filename}`;
}

/**
 * Hapus file image dari filesystem
 */
export async function deleteImage(picturePath: string): Promise<void> {
  try {
    const fullPath = path.join(process.cwd(), picturePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  } catch (error) {
    console.error('Error deleting image:', error);
    // Don't throw error, just log it
  }
}

/**
 * Validate if the file is an image
 */
export function isValidImageFile(file: fileUpload.UploadedFile): boolean {
  const allowedMimes = new Set([
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp'
  ]);
  return allowedMimes.has(file.mimetype);
}
