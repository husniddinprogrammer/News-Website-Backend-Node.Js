const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { eq } = require('drizzle-orm');
const { db } = require('../../db');
const { news } = require('../../db/schema');
const { AppError } = require('../../middleware/error.middleware');
const logger = require('../../utils/logger');
const config = require('../../config');
const repo = require('./images.repository');

const COMPRESS_THRESHOLD = 100 * 1024; // 100 KB
// Absolute path — safe regardless of CWD at runtime
const UPLOAD_DIR = path.resolve(__dirname, '..', '..', '..', config.upload.dir);

async function compressIfNeeded(file) {
  if (file.size <= COMPRESS_THRESHOLD) return file.filename;

  const ext = path.extname(file.filename).toLowerCase();
  const inputPath = path.join(UPLOAD_DIR, file.filename);
  const tmpPath = inputPath + '.tmp';

  try {
    if (ext === '.png') {
      await sharp(inputPath).png({ quality: 80, compressionLevel: 9 }).toFile(tmpPath);
    } else {
      await sharp(inputPath).jpeg({ quality: 80, mozjpeg: true }).toFile(tmpPath);
    }
    fs.renameSync(tmpPath, inputPath);
  } catch (err) {
    // Remove tmp if it exists, keep original
    if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
    logger.warn({ err: err.message, file: file.filename }, 'Image compression failed, using original');
  }

  return file.filename;
}

async function upload(newsId, files, user) {
  const [item] = await db.select({ id: news.id, authorId: news.authorId }).from(news).where(eq(news.id, newsId)).limit(1);
  if (!item) throw new AppError('News not found', 404);
  if (user.role === 'ADMIN' && item.authorId !== user.id) {
    throw new AppError('You can only upload images to your own news', 403);
  }

  const records = await Promise.all(
    files.map(async (file) => {
      const filename = await compressIfNeeded(file);
      return { newsId, url: `/${config.upload.dir}/${filename}` };
    })
  );

  await repo.createMany(records);
  return repo.findByNews(newsId);
}

async function getByNews(newsId) {
  const [item] = await db.select({ id: news.id }).from(news).where(eq(news.id, newsId)).limit(1);
  if (!item) throw new AppError('News not found', 404);
  return repo.findByNews(newsId);
}

async function remove(imageId, user) {
  const image = await repo.findById(imageId);
  if (!image || image.isDeleted) throw new AppError('Image not found', 404);

  const [item] = await db.select({ authorId: news.authorId }).from(news).where(eq(news.id, image.newsId)).limit(1);
  if (user.role === 'ADMIN' && item?.authorId !== user.id) {
    throw new AppError('You can only delete images from your own news', 403);
  }

  await repo.softDelete(imageId);
}

module.exports = { upload, getByNews, remove };
