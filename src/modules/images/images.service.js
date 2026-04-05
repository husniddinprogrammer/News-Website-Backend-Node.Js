const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const prisma = require('../../config/database');
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
  const news = await prisma.news.findUnique({ where: { id: newsId }, select: { id: true, authorId: true } });
  if (!news) throw new AppError('News not found', 404);
  if (user.role === 'ADMIN' && news.authorId !== user.id) {
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
  const news = await prisma.news.findUnique({ where: { id: newsId }, select: { id: true } });
  if (!news) throw new AppError('News not found', 404);
  return repo.findByNews(newsId);
}

async function remove(imageId, user) {
  const image = await repo.findById(imageId);
  if (!image || image.isDeleted) throw new AppError('Image not found', 404);

  const news = await prisma.news.findUnique({ where: { id: image.newsId }, select: { authorId: true } });
  if (user.role === 'ADMIN' && news?.authorId !== user.id) {
    throw new AppError('You can only delete images from your own news', 403);
  }

  await repo.softDelete(imageId);
}

module.exports = { upload, getByNews, remove };
