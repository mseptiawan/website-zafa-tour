import mongoose from "mongoose";
import dotenv from "dotenv";

// Import semua model yang dibutuhkan
import User from "../../models/User.js";
import Leave from "../../models/Leave.js";
import LeaveApproval from "../../models/LeaveApproval.js";
import LeaveBalance from "../../models/LeaveBalance.js";
import LeaveCancellation from "../../models/LeaveCancellation.js";
import LeaveType from "../../models/LeaveType.js";

dotenv.config();

await mongoose.connect(process.env.MONGODB_URI);

// ======================================================
// TARGET USERS (Sesuai Akun Login yang Ada)
// ======================================================
const usernames = ["basoherman", "ongkidwi", "sarwanto", "duwihartati", "ronaldrizky", "fadhilah"];

// ======================================================
// MASTER DATA POOL
// ======================================================
const leaveTypesMaster = [
  {
    name: "Cuti Tahunan",
    code: "AL",
    maxDays: 12,
    minAdvanceDays: 3,
    requiresAttachment: false,
    isDeductBalance: true,
    isActive: true,
    description: "Jatah jatah kuota cuti tahunan reguler karyawan.",
  },
  {
    name: "Cuti Sakit",
    code: "SL",
    maxDays: 14,
    minAdvanceDays: 0,
    requiresAttachment: true,
    isDeductBalance: false,
    isActive: true,
    description: "Cuti karena kondisi medis/kesehatan kurang baik, wajib surat dokter.",
  },
  {
    name: "Cuti Melahirkan",
    code: "ML",
    maxDays: 90,
    minAdvanceDays: 30,
    requiresAttachment: true,
    isDeductBalance: false,
    isActive: true,
    description: "Cuti khusus persalinan bagi karyawan perempuan.",
  },
  {
    name: "Cuti Urusan Penting",
    code: "EL",
    maxDays: 3,
    minAdvanceDays: 2,
    requiresAttachment: false,
    isDeductBalance: true,
    isActive: true,
    description: "Cuti mendesak seperti pernikahan, musibah, atau keperluan keluarga.",
  },
];

const leaveReasons = [
  "Acara perhelatan keluarga besar di luar kota",
  "Kondisi badan demam tinggi dan butuh istirahat total",
  "Menghadiri pernikahan saudara kandung",
  "Mengurus perpanjangan berkas dokumen negara yang tidak bisa diwakilkan",
  "Sakit flu berat dan batuk, disarankan istirahat oleh tim medis",
  "Keperluan mudik hari raya lebih awal menghindari macet",
];

const rejectionNotes = [
  "Ditolak karena operasional tim sedang high-load / kekurangan orang.",
  "Mohon ganti tanggal pelaksanaan, di tanggal tersebut ada rilis sistem besar.",
  "Dokumen pendukung / lampiran berkas belum valid atau buram.",
  "Ditolak, silakan diskusikan kembali pembagian tugas handover dengan rekan unit.",
];

const approvalNotes = [
  "Pekerjaan operasional sudah didelegasikan dengan aman.",
  "Silakan dilanjutkan ke tahap berikutnya.",
  "Berkas lengkap, disetujui untuk diproses.",
  "Rekomendasi disetujui sesuai dengan sisa jatah jatah kuota.",
];

const cancelReasons = [
  "Acara keluarga besar dibatalkan secara mendadak",
  "Tiket transportasi dan jadwal di-reschedule oleh pihak maskapai",
  "Kondisi urusan penting sudah selesai lebih cepat dari perkiraan",
  "Batal pergi karena ada kendala operasional mendadak di lapangan",
];

// ======================================================
// HELPERS
// ======================================================
function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate() {
  const start = new Date(2026, 0, 1);
  const end = new Date(2026, 11, 31);
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Menghitung hari efektif cuti (Mengabaikan Hari Minggu sesuai getDay)
function createLeaveDateRangeAndDuration() {
  const startDate = randomDate();
  const durationDays = Math.floor(Math.random() * 4) + 1; // Durasi rentang 1-4 hari

  let endDate = new Date(startDate);
  let totalDays = 0;
  let currentLoopDate = new Date(startDate);

  // Looping untuk mencari endDate dan totalDays bersih tanpa hari Minggu
  let daysAdded = 0;
  while (daysAdded < durationDays) {
    if (currentLoopDate.getDay() !== 0) {
      // Jika BUKAN Hari Minggu
      totalDays++;
      daysAdded++;
    }
    if (daysAdded < durationDays) {
      currentLoopDate.setDate(currentLoopDate.getDate() + 1);
    }
  }
  endDate = currentLoopDate;

  return { startDate, endDate, totalDays };
}

// ======================================================
// MAIN SEED ENGINE
// ======================================================
async function seed() {
  try {
    // 1. Validasi User Eksis
    const users = await User.find({ username: { $in: usernames } });
    if (!users.length) {
      console.log(
        "Error: Target users tidak ditemukan di database. Jalankan seeder User terlebih dahulu."
      );
      process.exit();
    }

    // 2. Bersihkan Data Lama Modul Cuti
    await LeaveType.deleteMany({});
    await LeaveBalance.deleteMany({});
    await Leave.deleteMany({});
    await LeaveApproval.deleteMany({});
    await LeaveCancellation.deleteMany({});

    console.log("✔ Master tabel modul cuti berhasil dibersihkan.");

    // 3. Seed Master LeaveType
    const createdLeaveTypes = await LeaveType.insertMany(leaveTypesMaster);
    console.log(`✔ Berhasil memuat ${createdLeaveTypes.length} Master Jenis Cuti.`);

    // 4. Seed LeaveBalance untuk Seluruh Target User (Tahun 2026)
    const balanceData = [];
    for (const user of users) {
      balanceData.push({
        userId: user._id,
        year: 2026,
        totalQuota: 12,
        used: 0, // Akan dihitung akumulasinya di bawah secara acak
        remaining: 12,
      });
    }
    await LeaveBalance.insertMany(balanceData);
    console.log("✔ Berhasil memuat Master Saldo Cuti awal seluruh karyawan.");

    // Container data massal transaksional
    const leavesToInsert = [];
    const approvalsToInsert = [];
    const cancellationsToInsert = [];

    const statuses = ["PENDING", "APPROVED", "REJECTED", "CANCELLED"];

    // 5. Loop Pembuatan Data Transaksi Cuti
    for (const user of users) {
      // Dapatkan daftar user lain untuk dijadikan target handoverUserId dan approverId
      const otherUsers = users.filter((u) => u._id.toString() !== user._id.toString());

      // Berikan perkiraan 15 records riwayat cuti per karyawan agar bervariasi
      for (let i = 0; i < 15; i++) {
        const status = randomItem(statuses);
        const leaveType = randomItem(createdLeaveTypes);
        const handoverUser = randomItem(otherUsers);
        const managerUser = randomItem(otherUsers);
        const hrUser =
          otherUsers.find((u) => u._id.toString() !== managerUser._id.toString()) || otherUsers[0];

        const { startDate, endDate, totalDays } = createLeaveDateRangeAndDuration();

        // Siapkan Object Dokumen Cuti Utama
        const leaveId = new mongoose.Types.ObjectId();

        leavesToInsert.push({
          _id: leaveId,
          userId: user._id,
          leaveTypeId: leaveType._id,
          startDate,
          endDate,
          totalDays,
          reason: randomItem(leaveReasons),
          documentPath: leaveType.requiresAttachment
            ? "/uploads/documents/surat-keterangan.pdf"
            : null,
          status,
          handoverUserId: handoverUser._id,
          createdAt: startDate,
          updatedAt: startDate,
        });

        // ======================================================
        // LOGIKA GENERATE LOG APPROVAL BERDASARKAN STATUS
        // ======================================================
        if (status === "PENDING") {
          // Jika status global masih PENDING, tandanya baru masuk tahap MANAGER atau HR
          const currentStep = Math.random() > 0.5 ? "MANAGER" : "HR";

          if (currentStep === "MANAGER") {
            approvalsToInsert.push({
              leaveId,
              step: "MANAGER",
              approverId: managerUser._id,
              status: "PENDING",
              note: "",
            });
          } else {
            // Berarti Manager sudah lolos APPROVED, sekarang tertahan di HR PENDING
            approvalsToInsert.push(
              {
                leaveId,
                step: "MANAGER",
                approverId: managerUser._id,
                status: "APPROVED",
                note: randomItem(approvalNotes),
                actionDate: startDate,
              },
              {
                leaveId,
                step: "HR",
                approverId: hrUser._id,
                status: "PENDING",
                note: "",
              }
            );
          }
        } else if (status === "APPROVED") {
          // Lolos verifikasi penuh dari Manager dan HRD
          approvalsToInsert.push(
            {
              leaveId,
              step: "MANAGER",
              approverId: managerUser._id,
              status: "APPROVED",
              note: randomItem(approvalNotes),
              actionDate: startDate,
            },
            {
              leaveId,
              step: "HR",
              approverId: hrUser._id,
              status: "APPROVED",
              note: randomItem(approvalNotes),
              actionDate: new Date(startDate.getTime() + 3600000 * 2), // +2 Jam setelah manager
            }
          );

          // Update akumulasi kuota pada data saldo array balanceData lokal
          if (leaveType.isDeductBalance) {
            const userBalance = balanceData.find(
              (b) => b.userId.toString() === user._id.toString()
            );
            if (userBalance) {
              userBalance.used += totalDays;
              userBalance.remaining = Math.max(0, userBalance.totalQuota - userBalance.used);
            }
          }
        } else if (status === "REJECTED") {
          // Kasus penolakan bisa terjadi langsung di meja Manager, atau lolos Manager tapi ditolak HR
          const rejectAtStep = Math.random() > 0.5 ? "MANAGER" : "HR";

          if (rejectAtStep === "MANAGER") {
            approvalsToInsert.push({
              leaveId,
              step: "MANAGER",
              approverId: managerUser._id,
              status: "REJECTED",
              note: randomItem(rejectionNotes),
              actionDate: startDate,
            });
          } else {
            approvalsToInsert.push(
              {
                leaveId,
                step: "MANAGER",
                approverId: managerUser._id,
                status: "APPROVED",
                note: randomItem(approvalNotes),
                actionDate: startDate,
              },
              {
                leaveId,
                step: "HR",
                approverId: hrUser._id,
                status: "REJECTED",
                note: randomItem(rejectionNotes),
                actionDate: new Date(startDate.getTime() + 3600000 * 3),
              }
            );
          }
        } else if (status === "CANCELLED") {
          // Kasus pembatalan: Harus di-APPROVED dulu secara sistem reguler, baru diajukan transaksi pembatalan
          approvalsToInsert.push(
            {
              leaveId,
              step: "MANAGER",
              approverId: managerUser._id,
              status: "APPROVED",
              note: randomItem(approvalNotes),
              actionDate: startDate,
            },
            {
              leaveId,
              step: "HR",
              approverId: hrUser._id,
              status: "APPROVED",
              note: randomItem(approvalNotes),
              actionDate: new Date(startDate.getTime() + 3600000),
            }
          );

          // Buat record pelengkap dokumen pembatalan di tabel LeaveCancellation
          const cancelStatus = randomItem(["PENDING", "APPROVED", "REJECTED"]);
          cancellationsToInsert.push({
            leaveId,
            requestedBy: user._id,
            cancelReason: randomItem(cancelReasons),
            status: cancelStatus,
            processedBy: cancelStatus !== "PENDING" ? hrUser._id : null,
            processAt: cancelStatus !== "PENDING" ? new Date(startDate.getTime() + 86400000) : null, // +1 Hari
            note:
              cancelStatus === "REJECTED"
                ? randomItem(rejectionNotes)
                : cancelStatus === "APPROVED"
                  ? "Pembatalan disetujui, saldo dikembalikan."
                  : "",
          });

          // JIKA pembatalan ditolak/masih pending, jatah kuota tetap terhitung hangus (terpotong)
          if (
            (cancelStatus === "PENDING" || cancelStatus === "REJECTED") &&
            leaveType.isDeductBalance
          ) {
            const userBalance = balanceData.find(
              (b) => b.userId.toString() === user._id.toString()
            );
            if (userBalance) {
              userBalance.used += totalDays;
              userBalance.remaining = Math.max(0, userBalance.totalQuota - userBalance.used);
            }
          }
          // Jika cancelStatus APPROVED -> Tidak memotong kuota (Rollback berhasil dilakukan)
        }
      }
    }

    // 6. Jalankan Bulk Update Massal ke Database MongoDB
    await Leave.insertMany(leavesToInsert);
    await LeaveApproval.insertMany(approvalsToInsert);
    await LeaveCancellation.insertMany(cancellationsToInsert);

    // 7. Perbarui dokumen tabel saldo kuota di MongoDB sesuai kalkulasi simulasi di atas
    for (const updatedBalance of balanceData) {
      await LeaveBalance.updateOne(
        { userId: updatedBalance.userId, year: updatedBalance.year },
        { $set: { used: updatedBalance.used, remaining: updatedBalance.remaining } }
      );
    }

    console.log(`✔ Sukses menggenerasikan data transaksi ke database:`);
    console.log(`   - ${leavesToInsert.length} Dokumen Pengajuan Cuti (Leave)`);
    console.log(`   - ${approvalsToInsert.length} Log History Persetujuan (LeaveApproval)`);
    console.log(`   - ${cancellationsToInsert.length} Form Dokumen Pembatalan (LeaveCancellation)`);
    console.log(`\n=== PROSES SEEDER TRANSAKSI CUTI SELESAI DAN KOKOH ===`);

    await mongoose.disconnect();
  } catch (err) {
    console.error("X Terjadi kegagalan proses pembuatan data seeder:", err);
    await mongoose.disconnect();
  }
}

seed();
