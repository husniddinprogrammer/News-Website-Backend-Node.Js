const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const prisma = require('../../config/database');
const { AppError } = require('../../middleware/error.middleware');
const config = require('../../config');
const repo = require('./images.repository');

const COMPRESS_THRESHOLD = 100 * 1024; // 100 KB

async function compressIfNeeded(file) {
  if (file.size <= COMPRESS_THRESHOLD) return file.filename;

  const ext = path.extname(file.filename).toLowerCase();
  const inputPath = path.resolve(config.upload.dir, file.filename);

  if (ext === '.png') {
    await sharp(inputPath)
      .png({ quality: 80, compressionLevel: 9 })
      .toFile(inputPath + '.tmp');
  } else {
    await sharp(inputPath)
      .jpeg({ quality: 80, mozjpeg: true })
      .toFile(inputPath + '.tmp');
  }

  fs.renameSync(inputPath + '.tmp', inputPath);

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
