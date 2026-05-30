import mongoose from "mongoose";
import dotenv from "dotenv";

import User from "../../models/basic/User.js";
import Role from "../../models/basic/Role.js";
import Leave from "../../models/leave/Leave.model.js";
import LeaveApproval from "../../models/leave/LeaveApproval.model.js";
import LeaveBalance from "../../models/leave/LeaveBalance.model.js";
import LeaveType from "../../models/leave/LeaveType.model.js";
import LeaveCancellation from "../../models/leave/LeaveCancellation.model.js";

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
    description: "Jatah kuota cuti tahunan reguler Pegawai.",
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

    await LeaveType.deleteMany({});
    await LeaveBalance.deleteMany({});
    await Leave.deleteMany({});
    await LeaveApproval.deleteMany({});
    await LeaveCancellation.deleteMany({});

    const createdLeaveTypes = await LeaveType.insertMany(leaveTypesMaster);

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

    const leavesToInsert = [];
    const approvalsToInsert = [];
    const cancellationsToInsert = [];

    const statuses = ["PENDING", "APPROVED", "REJECTED", "CANCELLED", "CANCELLATION_PENDING"];

    const targetUsernames = [
      "basoherman",
      "ongkidwi",
      "sarwanto",
      "duwihartati",
      "ronaldrizky",
      "fadhilah",
      "meltisundari",
      "fajarjaniko",
    ];

    for (const user of users) {
      const otherUsers = users.filter((u) => u._id.toString() !== user._id.toString());

      const managerUser =
        users.find((u) => u.roleId && u.roleId.name === "MANAGER_ADMINISTRASI") ||
        (otherUsers.length ? otherUsers[0] : user);
      const hrUser =
        users.find((u) => u.roleId && u.roleId.name === "WAKIL_DIREKTUR") ||
        (otherUsers.length ? otherUsers[1] : user);
      const pimpinanUser =
        users.find((u) => u.roleId && u.roleId.name === "DIREKTUR_UTAMA") ||
        (otherUsers.length ? otherUsers[2] : user);

      const userRoleName = (user.roleId ? user.roleId.name : "STAFF").toUpperCase();

      const currentUsername = user.username ? user.username.toLowerCase().trim() : "";
      const loopsPerUser = targetUsernames.includes(currentUsername) ? 30 : 6;

      for (let i = 0; i < loopsPerUser; i++) {
        const status = randomItem(statuses);
        const leaveType = randomItem(createdLeaveTypes);

        const hasHandover = otherUsers.length > 0 && Math.random() > 0.3;
        const handoverUser = hasHandover ? randomItem(otherUsers) : null;

        const { startDate, endDate, totalDays } = createLeaveDateRangeAndDuration(
          leaveType.maxDays
        );
        const leaveId = new mongoose.Types.ObjectId();

        let approvalSteps = [];

        if (handoverUser) {
          approvalSteps.push({ step: "HANDOVER", approver: handoverUser });
        }

        if (userRoleName === "STAFF" || userRoleName === "EMPLOYEE") {
          approvalSteps.push({ step: "MANAGER_ADMINISTRASI", approver: managerUser });
          approvalSteps.push({ step: "WAKIL_DIREKTUR", approver: hrUser });
        } else if (userRoleName === "MANAGER_ADMINISTRASI") {
          approvalSteps.push({ step: "WAKIL_DIREKTUR", approver: hrUser });
        } else if (userRoleName === "WAKIL_DIREKTUR") {
          approvalSteps.push({ step: "DIREKTUR_UTAMA", approver: pimpinanUser });
        } else {
          approvalSteps.push({ step: "WAKIL_DIREKTUR", approver: hrUser });
        }

        if (status === "PENDING") {
          let currentStepApproved = true;

          approvalSteps.forEach((flow, idx) => {
            if (currentStepApproved) {
              if (idx === 0 && Math.random() > 0.5) {
                approvalsToInsert.push({
                  leaveId,
                  step: flow.step,
                  approverId: flow.approver._id,
                  status: "PENDING",
                  note: "",
                });
                currentStepApproved = false;
              } else if (idx === approvalSteps.length - 1) {
                approvalsToInsert.push({
                  leaveId,
                  step: flow.step,
                  approverId: flow.approver._id,
                  status: "PENDING",
                  note: "",
                });
                currentStepApproved = false;
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
        } else if (status === "APPROVED") {
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
          let hasRejected = false;
          approvalSteps.forEach((flow, idx) => {
            if (!hasRejected) {
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
                hasRejected = true;
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
        } else if (status === "CANCELLED") {
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

          cancellationsToInsert.push({
            leaveId,
            requestedBy: user._id,
            cancelReason: randomItem(cancelReasons),
            status: "APPROVED",
            processedBy: hrUser._id,
            processAt: startDate,
            note: "Pembatalan disetujui, kuota Pegawai tidak dipotong.",
          });
        } else if (status === "CANCELLATION_PENDING") {
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

          approvalsToInsert.push({
            leaveId,
            step:
              userRoleName === "MANAGER_ADMINISTRASI" ? "WAKIL_DIREKTUR" : "MANAGER_ADMINISTRASI",
            approverId: userRoleName === "MANAGER_ADMINISTRASI" ? hrUser._id : managerUser._id,
            status: "PENDING",
            note: "Persetujuan pembatalan disetujui oleh Manager, menunggu verifikasi akhir wakil direktur",
          });

          cancellationsToInsert.push({
            leaveId,
            requestedBy: user._id,
            cancelReason: randomItem(cancelReasons),
            status: "PENDING",
            note: "Menunggu verifikasi atasan.",
          });

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

    await Leave.insertMany(leavesToInsert);
    await LeaveApproval.insertMany(approvalsToInsert);
    if (cancellationsToInsert.length > 0) {
      await LeaveCancellation.insertMany(cancellationsToInsert);
    }

    for (const updatedBalance of balanceData) {
      await LeaveBalance.updateOne(
        { userId: updatedBalance.userId, year: updatedBalance.year },
        { $set: { used: updatedBalance.used, remaining: updatedBalance.remaining } }
      );
    }
  } catch (err) {
    console.error("Terjadi kegagalan proses pembuatan data seeder:", err);
  }
}
