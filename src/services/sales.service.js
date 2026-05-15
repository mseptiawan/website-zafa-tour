import SalesVisit from "../models/SalesVisit.js";

const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

const create = async ({ body, files, userId }) => {
  let { title, address, meetWith, result } = body;

  title = title?.trim();
  address = address?.trim();
  meetWith = meetWith?.trim();
  result = result?.trim();

  // VALIDATION (business layer)
  if (!title) throw new Error("Judul wajib diisi");
  if (!address) throw new Error("Alamat wajib diisi");
  if (!meetWith) throw new Error("Bertemu dengan wajib diisi");

  if (title.length > 100) throw new Error("Judul maksimal 100 karakter");
  if (address.length > 300) throw new Error("Alamat maksimal 300 karakter");
  if (meetWith.length > 100) throw new Error("Meet with maksimal 100 karakter");
  if (result && result.length > 500) throw new Error("Hasil maksimal 500 karakter");

  // FILE VALIDATION
  const attachments = (files || []).map((file) => {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new Error("Format file tidak valid (JPG, PNG, WEBP, PDF)");
    }

    return {
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: `/uploads/files/${file.filename}`,
    };
  });

  return SalesVisit.create({
    userId,
    title,
    address,
    meetWith,
    result,
    attachments,
    visitTime: new Date(),
  });
};

const findMine = async (userId) => {
  return SalesVisit.find({ userId }).sort({ createdAt: -1 });
};

const findAll = async () => {
  return SalesVisit.find().populate("userId").sort({ createdAt: -1 });
};

const findById = async (id) => {
  return SalesVisit.findById(id).populate("userId");
};

export default {
  create,
  findMine,
  findAll,
  findById,
};
