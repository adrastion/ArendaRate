import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { authenticate, AuthRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import { prisma } from '../lib/prisma';

const router = express.Router();

// Создание директории для загрузок
const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Настройка multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  },
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'jpg,jpeg,png,webp')
    .split(',')
    .map((t) => t.trim());
  const ext = path.extname(file.originalname).toLowerCase().slice(1);

  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(createError(`File type .${ext} is not allowed. Allowed types: ${allowedTypes.join(', ')}`, 400));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880'), // 5MB по умолчанию
  },
});

// Загрузка фото для отзыва
router.post(
  '/photos',
  authenticate,
  upload.array('photos', 5), // Максимум 5 фотографий
  async (req: AuthRequest, res, next) => {
    try {
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        throw createError('No files uploaded', 400);
      }

      if (files.length > 5) {
        throw createError('Maximum 5 photos allowed', 400);
      }

      const photos = files.map((file) => ({
        url: `/uploads/${file.filename}`,
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
      }));

      res.json({ photos });
    } catch (error) {
      next(error);
    }
  }
);

// Связывание фото с отзывом (вызывается после создания отзыва)
router.post(
  '/photos/link',
  authenticate,
  [
    express.json(),
    express.urlencoded({ extended: true }),
  ],
  async (req: AuthRequest, res, next) => {
    try {
      const { reviewId, photoUrls } = req.body;

      if (!reviewId || !Array.isArray(photoUrls)) {
        throw createError('Review ID and photo URLs array are required', 400);
      }

      // Проверка, что отзыв принадлежит пользователю
      const review = await prisma.review.findUnique({
        where: { id: reviewId },
      });

      if (!review) {
        throw createError('Review not found', 404);
      }

      if (review.userId !== req.user!.id) {
        throw createError('Unauthorized', 403);
      }

      // Создание записей фото
      const photos = await Promise.all(
        photoUrls.map(async (url: string) => {
          const fileName = path.basename(url);
          const filePath = path.join(uploadDir, fileName);

          // Проверка существования файла
          if (!fs.existsSync(filePath)) {
            throw createError(`File not found: ${fileName}`, 400);
          }

          const stats = fs.statSync(filePath);

          return prisma.photo.create({
            data: {
              reviewId,
              url,
              fileName,
              fileSize: stats.size,
              mimeType: path.extname(fileName),
            },
          });
        })
      );

      res.json({ photos });
    } catch (error) {
      next(error);
    }
  }
);

export default router;

