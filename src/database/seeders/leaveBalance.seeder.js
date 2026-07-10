import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../../models/basic/User.model.js";
import LeaveType from "../../models/leave/LeaveType.model.js";
import LeaveBalance from "../../models/leave/LeaveBalance.model.js";
import Leave from "../../models/leave/Leave.model.js";

dotenv.config();

const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

export const leaveBalance = async () => {
  try {
    console.log("START SEEDING LEAVE SYSTEM");

    const users = await User.find({});
    if (!users.length) {
      console.log("Gagal: Tidak ada user di database. Jalankan seeder User terlebih dahulu.");
      return;
    }

    console.log("Seeding Leave Types...");
    const leaveTypesData = [
      {
        name: "Cuti Tahunan",
        code: "CT",
        maxDays: 12,
        minAdvanceDays: 7,
        requiresAttachment: false,
        isDeductBalance: true,
      },
      {
        name: "Sakit Dengan Surat Dokter",
        code: "SK",
        maxDays: 30,
        minAdvanceDays: 0,
        requiresAttachment: true,
        isDeductBalance: false,
      },
      {
        name: "Cuti Melahirkan",
        code: "CM",
        maxDays: 90,
        minAdvanceDays: 30,
        requiresAttachment: true,
        isDeductBalance: false,
      },
      {
        name: "Izin Penting / Keperluan Mendesak",
        code: "IP",
        maxDays: 3,
        minAdvanceDays: 1,
        requiresAttachment: false,
        isDeductBalance: false,
      },
    ];

    for (const type of leaveTypesData) {
      await LeaveType.updateOne({ code: type.code }, { $set: type }, { upsert: true });
    }
    console.log("Leave Types ready.");

    const ctType = await LeaveType.findOne({ code: "CT" });
    const skType = await LeaveType.findOne({ code: "SK" });

    console.log("Seeding Leave Balances (Year 2026)...");
    const currentYear = 2026;
    const defaultQuota = 12;
    const balanceOperations = [];

    for (const user of users) {
      balanceOperations.push({
        updateOne: {
          filter: { userId: user._id, year: currentYear },
          update: {
            $setOnInsert: {
              totalQuota: defaultQuota,
              used: 0,
              remaining: defaultQuota,
            },
          },
          upsert: true,
        },
      });
    }
    const balanceResult = await LeaveBalance.bulkWrite(balanceOperations);
    console.log(
      `Balances Matched: ${balanceResult.matchedCount}, Upserted: ${balanceResult.upsertedCount}`
    );

    console.log("Seeding Sample Leave Applications...");

    await Leave.deleteMany({});

    const leaveApplications = [];
    const sampleUsers = users.slice(0, 5);

    for (const user of sampleUsers) {
      const startCT = new Date(Date.UTC(2026, 4, 12));
      const endCT = new Date(Date.UTC(2026, 4, 14));
      const totalDaysCT = 3;

      leaveApplications.push({
        userId: user._id,
        leaveTypeId: ctType._id,
        startDate: startCT,
        endDate: endCT,
        totalDays: totalDaysCT,
        reason: "Acara pernikahan keluarga di luar kota.",
        status: "APPROVED",
        handoverUserId: users.find((u) => !u._id.equals(user._id))?._id || null,
      });

      await LeaveBalance.updateOne(
        { userId: user._id, year: currentYear },
        {
          $set: {
            used: totalDaysCT,
            remaining: defaultQuota - totalDaysCT,
          },
        }
      );

      const startSK = new Date(Date.UTC(2026, 6, 5));
      const endSK = new Date(Date.UTC(2026, 6, 6));

      leaveApplications.push({
        userId: user._id,
        leaveTypeId: skType._id,
        startDate: startSK,
        endDate: endSK,
        totalDays: 2,
        reason: "Demam tinggi dan disarankan bedrest oleh dokter.",
        documentPath: "/uploads/documents/surat-dokter-sample.pdf",
        status: "PENDING",
      });
    }

    if (leaveApplications.length > 0) {
      await Leave.insertMany(leaveApplications);
      console.log(
        `Berhasil menyuntikkan ${leaveApplications.length} riwayat pengajuan cuti sampel.`
      );
    }

    console.log("LEAVE SYSTEM SEEDING SUCCESSFUL");
  } catch (error) {
    console.error("Proses seeding leave system gagal total:", error);
  }
};

export default leaveBalance;
