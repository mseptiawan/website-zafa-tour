import mongoose from "mongoose";
import dotenv from "dotenv";

import User from "../../models/User.js";
import Role from "../../models/Role.js";
import Leave from "../../models/leave/Leave.model.js";
import LeaveApproval from "../../models/leave/LeaveApproval.model.js";
import LeaveBalance from "../../models/leave/LeaveBalance.model.js";
import LeaveType from "../../models/leave/LeaveType.model.js";
import LeaveCancellation from "../../models/leave/LeaveCancellation.model.js"; // Import model pembatalan baru

dotenv.config();

const leaveTypesMaster = [
  {
    name: "Cuti Tahunan",
    code: "AL",
    maxDays: 12,
    minAdvanceDays: 3,
    requiresAttachment: false,
    isDeductBalance: true,
    isActive: true,
    description: "Jatah kuota cuti tahunan reguler karyawan.",
  },
  {
    name: "Cuti Sakit",
    code: "SL",
    maxDays: 14,
    minAdvanceDays: 0,
    requiresAttachment: true,
    isDeductBalance: false,
    isActive: true,
    description: "Cuti sakit, wajib surat dokter.",
  },
  {
    name: "Cuti Melahirkan",
    code: "ML",
    maxDays: 90,
    minAdvanceDays: 0,
    requiresAttachment: false,
    isDeductBalance: false,
    isActive: true,
    description: "Cuti melahirkan diberi waktu 3 bulan.",
  },
];

const leaveReasons = [
  "Acara pernikahan keluarga di luar kota",
  "Kondisi badan demam tinggi dan butuh istirahat",
  "Menghadiri wisuda adik kandung",
  "Keperluan mudik hari raya lebih awal",
  "Persiapan persalinan dan masa nifas",
];

const cancelReasons = [
  "Rencana liburan keluarga diundur oleh pihak maskapai",
  "Ada meeting mendadak dengan klien penting yang tidak bisa didelegasikan",
  "Kondisi keluarga di kampung sudah membaik",
  "Proyek internal dimajukan jadwal rilisnya",
];

const rejectionNotes = [
  "Operasional tim sedang high-load, kekurangan orang.",
  "Silakan diskusikan pembagian tugas handover dengan rekan unit.",
  "Kuota pengajuan pada tanggal tersebut sudah penuh di divisi Anda.",
];

const approvalNotes = [
  "Pekerjaan operasional aman untuk didelegasikan.",
  "Berkas sesuai ketentuan, disetujui.",
  "Rekomendasi disetujui untuk tahap selanjutnya.",
];

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate() {
  const start = new Date(2026, 0, 1);
  const end = new Date(2026, 11, 31);
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function createLeaveDateRangeAndDuration(maxDays = null) {
  const startDate = randomDate();
  const durationDays = maxDays && maxDays > 14 ? maxDays : Math.floor(Math.random() * 4) + 1;

  let totalDays = 0;
  let currentLoopDate = new Date(startDate);

  let daysAdded = 0;
  while (daysAdded < durationDays) {
    if (currentLoopDate.getDay() !== 0) {
      totalDays++;
      daysAdded++;
    }
    if (daysAdded < durationDays) {
      currentLoopDate.setDate(currentLoopDate.getDate() + 1);
    }
  }
  const endDate = currentLoopDate;
  return { startDate, endDate, totalDays };
}

export default async function leaveSeeder() {
  try {
    const users = await User.find({}).populate("roleId");

    if (!users.length) {
      console.log("Error: Tidak ada user sama sekali di database.");
      return;
    }

    // Bersihkan semua data lama
    await LeaveType.deleteMany({});
    await LeaveBalance.deleteMany({});
    await Leave.deleteMany({});
    await LeaveApproval.deleteMany({});
    await LeaveCancellation.deleteMany({});

    console.log("✔ Master tabel modul cuti berhasil dibersihkan.");

    const createdLeaveTypes = await LeaveType.insertMany(leaveTypesMaster);
    console.log(`✔ Berhasil memuat ${createdLeaveTypes.length} Master Jenis Cuti.`);

    const balanceData = [];
    for (const user of users) {
      balanceData.push({
        userId: user._id,
        year: 2026,
        totalQuota: 12,
        used: 0,
        remaining: 12,
      });
    }
    await LeaveBalance.insertMany(balanceData);
    console.log(`✔ Berhasil memuat Master Saldo Cuti awal untuk ${users.length} user.`);

    const leavesToInsert = [];
    const approvalsToInsert = [];
    const cancellationsToInsert = [];

    // Memasukkan variasi status baru CANCELLATION_PENDING
    const statuses = ["PENDING", "APPROVED", "REJECTED", "CANCELLED", "CANCELLATION_PENDING"];

    for (const user of users) {
      const otherUsers = users.filter((u) => u._id.toString() !== user._id.toString());

      // Fallback structural roles
      const managerUser =
        users.find((u) => u.roleId && u.roleId.name === "MANAGER") ||
        (otherUsers.length ? otherUsers[0] : user);
      const hrUser =
        users.find((u) => u.roleId && u.roleId.name === "HR") ||
        (otherUsers.length ? otherUsers[1] : user);
      const pimpinanUser =
        users.find((u) => u.roleId && u.roleId.name === "PIMPINAN") ||
        (otherUsers.length ? otherUsers[2] : user);

      const userRoleName = (user.roleId ? user.roleId.name : "STAFF").toUpperCase();
      const loopsPerUser = 6;

      for (let i = 0; i < loopsPerUser; i++) {
        const status = randomItem(statuses);
        const leaveType = randomItem(createdLeaveTypes);

        const hasHandover = otherUsers.length > 0 && Math.random() > 0.3;
        const handoverUser = hasHandover ? randomItem(otherUsers) : null;

        const { startDate, endDate, totalDays } = createLeaveDateRangeAndDuration(
          leaveType.maxDays
        );
        const leaveId = new mongoose.Types.ObjectId();

        // 1. Tentukan Hirarki Alur Approval Berdasarkan Siapa yang Mengajukan Cuti
        let approvalSteps = [];

        if (handoverUser) {
          approvalSteps.push({ step: "HANDOVER", approver: handoverUser });
        }

        if (userRoleName === "STAFF" || userRoleName === "EMPLOYEE") {
          approvalSteps.push({ step: "MANAGER", approver: managerUser });
          approvalSteps.push({ step: "HR", approver: hrUser });
        } else if (userRoleName === "MANAGER") {
          approvalSteps.push({ step: "HR", approver: hrUser });
        } else if (userRoleName === "HR") {
          approvalSteps.push({ step: "PIMPINAN", approver: pimpinanUser });
        } else {
          // Jika pimpinan/role lain mengajukan cuti, langsung ditinjau HR / Pimpinan lain
          approvalSteps.push({ step: "HR", approver: hrUser });
        }

        // 2. Olah Data Berdasarkan Status Target Pengajuan

        // --- KONDISI A: PENDING (Sedang Berjalan) ---
        if (status === "PENDING") {
          // Buat agar langkah pertama APPROVED, langkah kedua PENDING (realistis di lapangan)
          let currentStepApproved = true;

          approvalSteps.forEach((flow, idx) => {
            if (currentStepApproved) {
              if (idx === 0 && Math.random() > 0.5) {
                // Langkah pertama langsung tertahan PENDING
                approvalsToInsert.push({
                  leaveId,
                  step: flow.step,
                  approverId: flow.approver._id,
                  status: "PENDING",
                  note: "",
                });
                currentStepApproved = false;
              } else if (idx === approvalSteps.length - 1) {
                // Jika sampai langkah akhir belum diputus, jadikan langkah terakhir ini PENDING
                approvalsToInsert.push({
                  leaveId,
                  step: flow.step,
                  approverId: flow.approver._id,
                  status: "PENDING",
                  note: "",
                });
                currentStepApproved = false;
              } else {
                // Langkah antara disetujui
                approvalsToInsert.push({
                  leaveId,
                  step: flow.step,
                  approverId: flow.approver._id,
                  status: "APPROVED",
                  note: randomItem(approvalNotes),
                  actionDate: startDate,
                });
              }
            }
          });
        }

        // --- KONDISI B: APPROVED (Semua Langkah Rampung) ---
        else if (status === "APPROVED") {
          approvalSteps.forEach((flow) => {
            approvalsToInsert.push({
              leaveId,
              step: flow.step,
              approverId: flow.approver._id,
              status: "APPROVED",
              note: randomItem(approvalNotes),
              actionDate: startDate,
            });
          });

          // Kurangi kuota balance jika tipenya memotong kuota
          if (leaveType.isDeductBalance) {
            const userBalance = balanceData.find(
              (b) => b.userId.toString() === user._id.toString()
            );
            if (userBalance) {
              userBalance.used += totalDays;
              userBalance.remaining = Math.max(0, userBalance.totalQuota - userBalance.used);
            }
          }
        }

        // --- KONDISI C: REJECTED (Salah Satu Menolak) ---
        else if (status === "REJECTED") {
          let hasRejected = false;
          approvalSteps.forEach((flow, idx) => {
            if (!hasRejected) {
              // Acak step mana yang menjadi eksekutor penolakan berkas
              const operationalReject = idx === approvalSteps.length - 1 || Math.random() > 0.5;
              if (operationalReject) {
                approvalsToInsert.push({
                  leaveId,
                  step: flow.step,
                  approverId: flow.approver._id,
                  status: "REJECTED",
                  note: randomItem(rejectionNotes),
                  actionDate: startDate,
                });
                hasRejected = true; // Hentikan step berikutnya karena berkas sudah mati
              } else {
                approvalsToInsert.push({
                  leaveId,
                  step: flow.step,
                  approverId: flow.approver._id,
                  status: "APPROVED",
                  note: randomItem(approvalNotes),
                  actionDate: startDate,
                });
              }
            }
          });
        }

        // --- KONDISI D: CANCELLED (Pembatalan Mutlak Selesai Disetujui) ---
        else if (status === "CANCELLED") {
          // Anggap pengajuan awalnya sudah FULL APPROVED
          approvalSteps.forEach((flow) => {
            approvalsToInsert.push({
              leaveId,
              step: flow.step,
              approverId: flow.approver._id,
              status: "APPROVED",
              note: randomItem(approvalNotes),
              actionDate: startDate,
            });
          });

          // Masuk ke log pembatalan yang disetujui HR
          cancellationsToInsert.push({
            leaveId,
            requestedBy: user._id,
            cancelReason: randomItem(cancelReasons),
            status: "APPROVED",
            processedBy: hrUser._id,
            processAt: startDate,
            note: "Pembatalan disetujui, kuota karyawan tidak dipotong.",
          });

          // Saldo balance aman (tidak bertambah/terpotong karena dicancel)
        }

        // --- KONDISI E: CANCELLATION_PENDING (Sedang Mengajukan Batal) ---
        else if (status === "CANCELLATION_PENDING") {
          // Langkah pengajuan cuti awal tentu sudah disetujui semua
          approvalSteps.forEach((flow) => {
            approvalsToInsert.push({
              leaveId,
              step: flow.step,
              approverId: flow.approver._id,
              status: "APPROVED",
              note: randomItem(approvalNotes),
              actionDate: startDate,
            });
          });

          // Tambah antrean approval baru khusus untuk pembatalan di log transaksi utama
          approvalsToInsert.push({
            leaveId,
            step: userRoleName === "MANAGER" ? "HR" : "MANAGER", // Manager minta batal diverifikasi HR, staff diuji Manager dulu
            approverId: userRoleName === "MANAGER" ? hrUser._id : managerUser._id,
            status: "PENDING",
            note: "Persetujuan pembatalan disetujui oleh Manager, menunggu verifikasi akhir HR.",
          });

          // Masukkan entry data ke koleksi LeaveCancellation
          cancellationsToInsert.push({
            leaveId,
            requestedBy: user._id,
            cancelReason: randomItem(cancelReasons),
            status: "PENDING",
            note: "Menunggu verifikasi atasan.",
          });

          // Kuota awalnya sempat terpotong karena status sempat disetujui sebelum minta batal
          if (leaveType.isDeductBalance) {
            const userBalance = balanceData.find(
              (b) => b.userId.toString() === user._id.toString()
            );
            if (userBalance) {
              userBalance.used += totalDays;
              userBalance.remaining = Math.max(0, userBalance.totalQuota - userBalance.used);
            }
          }
        }

        // Push data cuti induk
        leavesToInsert.push({
          _id: leaveId,
          userId: user._id,
          leaveTypeId: leaveType._id,
          startDate,
          endDate,
          totalDays,
          reason:
            leaveType.code === "ML"
              ? "Persiapan persalinan dan masa nifas"
              : randomItem(leaveReasons),
          documentPath: leaveType.requiresAttachment ? "/uploads/documents/surat.pdf" : null,
          status,
          handoverUserId: handoverUser ? handoverUser._id : null,
          createdAt: startDate,
          updatedAt: startDate,
        });
      }
    }

    // Eksekusi insert massal ke database
    await Leave.insertMany(leavesToInsert);
    await LeaveApproval.insertMany(approvalsToInsert);
    if (cancellationsToInsert.length > 0) {
      await LeaveCancellation.insertMany(cancellationsToInsert);
    }

    // Simpan sinkronisasi saldo akhir
    for (const updatedBalance of balanceData) {
      await LeaveBalance.updateOne(
        { userId: updatedBalance.userId, year: updatedBalance.year },
        { $set: { used: updatedBalance.used, remaining: updatedBalance.remaining } }
      );
    }

    console.log(`✔ Sukses melakukan sinkronisasi seeder data transaksi baru:`);
    console.log(`   - Total User Terproses: ${users.length} Orang`);
    console.log(`   - ${leavesToInsert.length} Dokumen Pengajuan Cuti (Leave)`);
    console.log(`   - ${approvalsToInsert.length} Log Langkah Persetujuan (LeaveApproval)`);
    console.log(
      `   - ${cancellationsToInsert.length} Data Transaksi Pembatalan Cuti (LeaveCancellation)`
    );
    console.log(`\n=== PROSES UPDATE SEEDER BERHASIL DAN BERSIH ===`);
  } catch (err) {
    console.error("X Terjadi kegagalan proses pembuatan data seeder:", err);
  }
}
