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

module.exports = { uploadImage };
