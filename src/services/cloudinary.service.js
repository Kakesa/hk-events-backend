const fs = require('fs/promises');
const path = require('path');
const { Readable } = require('stream');
const cloudinary = require('../config/cloudinary');

const uploadImage = async (file, folder = 'hk-events') => {
  if (!file) return null;

  if (file.buffer) {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result.secure_url);
        }
      );

      Readable.from(file.buffer).pipe(uploadStream);
    });
  }

  if (file.path) {
    const result = await cloudinary.uploader.upload(file.path, {
      folder,
      resource_type: 'image',
    });
    return result.secure_url;
  }

  throw new Error('Fichier invalide');
};

const extractPublicId = (url) => {
  if (!url || !url.includes('cloudinary.com')) return null;
  const withoutQuery = url.split('?')[0];
  const uploadIdx = withoutQuery.indexOf('/upload/');
  if (uploadIdx === -1) return null;
  let publicPath = withoutQuery.slice(uploadIdx + '/upload/'.length);
  publicPath = publicPath.replace(/^v\d+\//, '');
  return publicPath.replace(/\.[^/.]+$/, '');
};

const deleteImageFromUrl = async (url) => {
  const publicId = extractPublicId(url);
  if (!publicId) return { skipped: true, url };

  try {
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
    return { deleted: result.result === 'ok', publicId, result: result.result };
  } catch (err) {
    return { error: err.message, publicId, url };
  }
};

const deleteLocalUpload = async (imageUrl) => {
  if (!imageUrl || !imageUrl.startsWith('/uploads/')) return { skipped: true };
  const filePath = path.join(__dirname, '..', imageUrl.replace(/^\//, ''));
  try {
    await fs.unlink(filePath);
    return { deleted: true, filePath };
  } catch (err) {
    if (err.code === 'ENOENT') return { skipped: true };
    return { error: err.message, filePath };
  }
};

const deleteStoredImage = async (url) => {
  if (!url) return { skipped: true };
  if (url.includes('cloudinary.com')) return deleteImageFromUrl(url);
  if (url.startsWith('/uploads/')) return deleteLocalUpload(url);
  return { skipped: true, url };
};

module.exports = {
  uploadImage,
  deleteImageFromUrl,
  deleteLocalUpload,
  deleteStoredImage,
};
