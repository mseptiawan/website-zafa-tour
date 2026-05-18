import mongoose from "mongoose";
import dotenv from "dotenv";

import User from "../../models/User.js";
import Leave from "../../models/leave/Leave.model.js";
import LeaveApproval from "../../models/leave/LeaveApproval.model.js";
import LeaveBalance from "../../models/leave/LeaveBalance.model.js";
import LeaveType from "../../models/leave/LeaveType.model.js";

dotenv.config();

await mongoose.connect(process.env.MONGODB_URI);

const usernames = ["basoherman", "ongkidwi", "sarwanto", "duwihartati", "ronaldrizky", "fadhilah"];

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
];

const leaveReasons = [
  "Acara pernikahan keluarga di luar kota",
  "Kondisi badan demam tinggi dan butuh istirahat",
  "Menghadiri wisuda adik kandung",
  "Keperluan mudik hari raya lebih awal",
];

const rejectionNotes = [
  "Operasional tim sedang high-load, kekurangan orang.",
  "Silakan diskusikan pembagian tugas handover dengan rekan unit.",
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

function createLeaveDateRangeAndDuration() {
  const startDate = randomDate();
  const durationDays = Math.floor(Math.random() * 4) + 1;

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

async function seed() {
  try {
    const users = await User.find({ username: { $in: usernames } });
    if (!users.length) {
      console.log("Error: Target users tidak ditemukan di database.");
      process.exit();
    }

    await LeaveType.deleteMany({});
    await LeaveBalance.deleteMany({});
    await Leave.deleteMany({});
    await LeaveApproval.deleteMany({});

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
    console.log("✔ Berhasil memuat Master Saldo Cuti awal.");

    const leavesToInsert = [];
    const approvalsToInsert = [];
    const statuses = ["PENDING", "APPROVED", "REJECTED", "CANCELLED"];

    for (const user of users) {
      const otherUsers = users.filter((u) => u._id.toString() !== user._id.toString());

      // Cari user spesifik berdasarkan role untuk approver lanjutan
      const managerUser = users.find((u) => u.role === "MANAGER") || otherUsers[0];
      const hrUser = users.find((u) => u.role === "HR") || otherUsers[1];
      const pimpinanUser = users.find((u) => u.role === "PIMPINAN") || otherUsers[2];

      for (let i = 0; i < 15; i++) {
        const status = randomItem(statuses);
        const leaveType = randomItem(createdLeaveTypes);

        // Aturan Handover Opsional (Peluang 70% pakai handover, 30% tanpa handover)
        const hasHandover = Math.random() > 0.3;
        const handoverUser = hasHandover ? randomItem(otherUsers) : null;

        const { startDate, endDate, totalDays } = createLeaveDateRangeAndDuration();
        const leaveId = new mongoose.Types.ObjectId();

        leavesToInsert.push({
          _id: leaveId,
          userId: user._id,
          leaveTypeId: leaveType._id,
          startDate,
          endDate,
          totalDays,
          reason: randomItem(leaveReasons),
          documentPath: leaveType.requiresAttachment ? "/uploads/documents/surat.pdf" : null,
          status,
          handoverUserId: handoverUser ? handoverUser._id : null,
          createdAt: startDate,
          updatedAt: startDate,
        });

        // =================================================================
        // SKENARIO FLOW APPROVAL BERTINGKAT SESUAI RULE
        // =================================================================

        // Tentukan jalur hierarki awal berdasarkan role pengaju jika tanpa handover
        let baseStep = "MANAGER";
        let baseApprover = managerUser;

        if (user.role === "HR") {
          baseStep = "PIMPINAN";
          baseApprover = pimpinanUser;
        } else if (user.role === "MANAGER") {
          baseStep = "HR";
          baseApprover = hrUser;
        }

        // --- KONDISI 1: STATUS PENDING ---
        if (status === "PENDING") {
          if (handoverUser) {
            // Kasus A: Mandek di persetujuan rekan handover
            if (Math.random() > 0.5) {
              approvalsToInsert.push({
                leaveId,
                step: "HANDOVER",
                approverId: handoverUser._id,
                status: "PENDING",
                note: "",
              });
            } else {
              // Kasus B: Handover beres, mandek di hierarki utama
              approvalsToInsert.push(
                {
                  leaveId,
                  step: "HANDOVER",
                  approverId: handoverUser._id,
                  status: "APPROVED",
                  note: randomItem(approvalNotes),
                  actionDate: startDate,
                },
                {
                  leaveId,
                  step: baseStep,
                  approverId: baseApprover._id,
                  status: "PENDING",
                  note: "",
                }
              );
            }
          } else {
            // Tanpa handover, langsung mandek di hierarki utama
            approvalsToInsert.push({
              leaveId,
              step: baseStep,
              approverId: baseApprover._id,
              status: "PENDING",
              note: "",
            });
          }
        }

        // --- KONDISI 2: STATUS APPROVED ---
        else if (status === "APPROVED") {
          if (handoverUser) {
            approvalsToInsert.push({
              leaveId,
              step: "HANDOVER",
              approverId: handoverUser._id,
              status: "APPROVED",
              note: randomItem(approvalNotes),
              actionDate: startDate,
            });
          }

          // Eksekusi urutan jalur manajerial sampai selesai
          if (user.role === "HR") {
            approvalsToInsert.push({
              leaveId,
              step: "PIMPINAN",
              approverId: pimpinanUser._id,
              status: "APPROVED",
              note: randomItem(approvalNotes),
              actionDate: startDate,
            });
          } else if (user.role === "MANAGER") {
            approvalsToInsert.push({
              leaveId,
              step: "HR",
              approverId: hrUser._id,
              status: "APPROVED",
              note: randomItem(approvalNotes),
              actionDate: startDate,
            });
          } else {
            // Karyawan Biasa: Lewat MANAGER -> Lewat HR
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
                actionDate: startDate,
              }
            );
          }

          // Kalkulasi pengurangan jatah cuti tahunan
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

        // --- KONDISI 3: STATUS REJECTED ---
        else if (status === "REJECTED") {
          // Kasus A: Ditolak oleh Handover langsung (jika ada handover)
          if (handoverUser && Math.random() > 0.6) {
            approvalsToInsert.push({
              leaveId,
              step: "HANDOVER",
              approverId: handoverUser._id,
              status: "REJECTED",
              note: randomItem(rejectionNotes),
              actionDate: startDate,
            });
          } else {
            // Lolos handover (jika ada), tapi ditolak di hierarki utama
            if (handoverUser) {
              approvalsToInsert.push({
                leaveId,
                step: "HANDOVER",
                approverId: handoverUser._id,
                status: "APPROVED",
                note: randomItem(approvalNotes),
                actionDate: startDate,
              });
            }

            approvalsToInsert.push({
              leaveId,
              step: baseStep,
              approverId: baseApprover._id,
              status: "REJECTED",
              note: randomItem(rejectionNotes),
              actionDate: startDate,
            });
          }
        }

        // --- KONDISI 4: STATUS CANCELLED ---
        else if (status === "CANCELLED") {
          // Dianggap dibatalkan sepihak oleh pemohon sebelum diproses penuh oleh siapapun
          if (handoverUser) {
            approvalsToInsert.push({
              leaveId,
              step: "HANDOVER",
              approverId: handoverUser._id,
              status: "PENDING",
              note: "Dibatalkan oleh pemohon",
            });
          } else {
            approvalsToInsert.push({
              leaveId,
              step: baseStep,
              approverId: baseApprover._id,
              status: "PENDING",
              note: "Dibatalkan oleh pemohon",
            });
          }
        }
      }
    }

    await Leave.insertMany(leavesToInsert);
    await LeaveApproval.insertMany(approvalsToInsert);

    for (const updatedBalance of balanceData) {
      await LeaveBalance.updateOne(
        { userId: updatedBalance.userId, year: updatedBalance.year },
        { $set: { used: updatedBalance.used, remaining: updatedBalance.remaining } }
      );
    }

    console.log(`✔ Sukses melakukan sinkronisasi seeder data transaksi baru:`);
    console.log(`   - ${leavesToInsert.length} Dokumen Pengajuan Cuti (Leave)`);
    console.log(`   - ${approvalsToInsert.length} Log Langkah Persetujuan (LeaveApproval)`);
    console.log(`\n=== PROSES UPDATE SEEDER BERHASIL DAN BERSIH ===`);

    await mongoose.disconnect();
  } catch (err) {
    console.error("X Terjadi kegagalan proses pembuatan data seeder:", err);
    await mongoose.disconnect();
  }
}

seed();
