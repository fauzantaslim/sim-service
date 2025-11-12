import multer from 'multer';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import { nanoid } from 'nanoid';

/**
 * Konfigurasi multer untuk upload file
 * Multer v3 tidak memerlukan storage configuration untuk memory storage (default behavior)
 */
export const upload = multer({
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB in bytes
  }
  // Note: fileFilter tidak tersedia di v3, validasi dilakukan di controller/service
});

/**
 * Middleware untuk upload single file dengan field name 'picture'
 */
export const uploadSingle = upload.single('picture');

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
