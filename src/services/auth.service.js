import bcrypt from "bcrypt";
import crypto from "crypto";
import { redisClient } from "../config/redis.js";
import { sendEmail } from "../services/email.service.js";
import User from "../models/basic/User.model.js";
import Employee from "../models/employee/Employee.model.js";
import { getPermissions } from "../services/permission.service.js";

/**
 * Memverifikasi kredensial user dan menyusun payload data session lengkap (Lean).
 * @param {string} identifier - Username atau Email user
 * @param {string} password - Plain text password dari form
 * @returns {Promise<Object>} Object data user untuk disimpan ke session
 * @throws {Error} Jika user tidak ditemukan atau password salah
 */
export const verifyAndBuildSession = async (identifier, password) => {
  const user = await User.findOne({
    $or: [{ username: identifier }, { email: identifier }],
  })
    .populate("roleId")
    .lean();

  if (!user) {
    const err = new Error("Akun dengan username atau email tersebut tidak ditemukan.");
    err.statusCode = 404;
    throw err;
  }
  if (user.status === "Inactive") {
    const err = new Error("Akun Anda telah dinonaktifkan karena pemutusan hubungan kerja (PHK).");
    err.statusCode = 403;
    throw err;
  }
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    const err = new Error("Password yang Anda masukkan salah.");
    err.statusCode = 401;
    throw err;
  }

  const employee = await Employee.findOne({ userId: user._id })
    .populate({
      path: "careerData",
      populate: [{ path: "bidangId" }, { path: "unitId" }, { path: "positionId" }],
    })
    .lean({ virtuals: true });

  const roleName = user.roleId?.name?.toUpperCase() || "";
  const managerRoles = [
    "MANAGER_KEUANGAN",
    "MANAGER_ADMINISTRASI",
    "MANAGER_HAJI_UMRAH",
    "WAKIL_DIREKTUR",
  ];
  const isManager = managerRoles.includes(roleName);

  const career =
    employee?.careerData && employee.careerData.length > 0 ? employee.careerData[0] : null;

  return {
    _id: user._id,
    username: user.username,
    email: user.email,
    employeeId: employee?._id || null,
    employeeNumber: employee?.employeeIdNumber || null,
    fullName: employee?.fullName || "User",
    foto_profile: employee?.foto_profile || null,
    gender: employee?.jenis_kelamin || null,
    role: roleName,
    roleId: user.roleId?._id || null,
    permissions: getPermissions(roleName),
    isManager,
    bidangId: career?.bidangId?._id || null,
    bidangName: career?.bidangId?.name || null,
    unitId: career?.unitId?._id || null,
    unitName: career?.unitId?.name || null,
    careerId: career?._id || null,
    positionId: career?.positionId?._id || null,
    positionName: career?.positionId?.name || null,
    status_pegawai: career?.status_pegawai || null,
    tanggal_mulai_bergabung: career?.tanggal_mulai_bergabung || null,
  };
};

/**
 * Membuat token reset password, menyimpannya di Redis, dan mengirim link reset via email.
 * @param {string} email - Alamat email tujuan reset
 * @returns {Promise<boolean>} True jika proses berhasil
 * @throws {Error} Jika email tidak terdaftar di sistem
 */
export const requestResetToken = async (email) => {
  const user = await User.findOne({ email }).lean();
  if (!user) {
    const err = new Error("Alamat email tidak terdaftar di sistem kami.");
    err.statusCode = 404;
    throw err;
  }

  const token = crypto.randomBytes(32).toString("hex");
  await redisClient.setEx(`reset:${token}`, 900, user.email);

  const resetLink = `${process.env.BASE_URL}/reset-password?token=${token}`;

  await sendEmail({
    to: email,
    subject: "Reset Password Akun",
    html: `
      <h2>Reset Password</h2>
      <p>Klik tombol di bawah ini untuk mengatur ulang password Anda:</p>
      <a href="${resetLink}" style="padding: 10px 20px; background: #2563eb; color: white; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
      <p>Link ini akan kedaluwarsa dalam 15 menit.</p>
    `,
  });

  return true;
};

/**
 * Mendapatkan email yang diasosiasikan dengan token reset di Redis.
 * @param {string} token - Token acak dari query string URL
 * @returns {Promise<string|null>} String email atau null jika tidak ada/expired
 */
export const getEmailByToken = async (token) => {
  return await redisClient.get(`reset:${token}`);
};

/**
 * Memperbarui password user melalui mekanisme token forgot-password.
 * @param {string} token - Token validasi dari Redis
 * @param {string} newPassword - Plain text password baru
 * @returns {Promise<boolean>} True jika pergantian sukses
 * @throws {Error} Jika token sudah kedaluwarsa atau tidak valid
 */
export const resetPasswordWithToken = async (token, newPassword) => {
  const email = await redisClient.get(`reset:${token}`);
  if (!email) {
    const err = new Error("Token tidak valid atau telah kedaluwarsa.");
    err.statusCode = 400;
    throw err;
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await User.updateOne({ email }, { $set: { password: hashedPassword } });
  await redisClient.del(`reset:${token}`);

  return true;
};

/**
 * Memperbarui password dari halaman internal (Change Password) dengan validasi password lama.
 * @param {string} userId - ID User yang sedang login
 * @param {string} currentPassword - Password lama untuk komparasi
 * @param {string} newPassword - Password baru pengganti
 * @returns {Promise<boolean>} True jika update database berhasil
 * @throws {Error} Jika password lama salah atau user tidak ditemukan
 */
export const updateInternalPassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findById(userId);
  if (!user) {
    const err = new Error("Data pengguna tidak ditemukan.");
    err.statusCode = 404;
    throw err;
  }

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    const err = new Error("Password saat ini yang Anda masukkan salah.");
    err.statusCode = 401;
    throw err;
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await User.updateOne({ _id: userId }, { $set: { password: hashedPassword } });

  return true;
};
