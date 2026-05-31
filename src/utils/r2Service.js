import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";
import dotenv from "dotenv";

dotenv.config();

const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

/**
 * Mengompres gambar dan mengunggahnya ke Cloudflare R2
 * @param {Object} fileObject - Objek req.file dari multer
 * @param {string} folder - Nama folder tujuan di R2 (misal: 'absensi')
 * @returns {Promise<string>} URL publik gambar yang berhasil diupload
 */
export const uploadAndCompressToR2 = async (fileObject, folder = "absensi") => {
  if (!fileObject) return null;

  const compressedBuffer = await sharp(fileObject.buffer)
    .resize({ width: 600 })
    .jpeg({ quality: 60 })
    .toBuffer();

  const fileExtension = "jpg";
  const uniqueFileName = `${folder}/${Date.now()}-${Math.round(Math.random() * 1e9)}.${fileExtension}`;

  const uploadParams = {
    Bucket: process.env.R2_BUCKET_NAME,
    Key: uniqueFileName,
    Body: compressedBuffer,
    ContentType: "image/jpeg",
  };

  await s3.send(new PutObjectCommand(uploadParams));

  return `${process.env.R2_PUBLIC_URL}/${uniqueFileName}`;
};
