import User from "../../models/basic/User.model.js";
import Employee from "../../models/employee/Employee.model.js";
import Permit from "../../models/Permit.model.js";

const seedPermit = async () => {
  try {
    await Permit.deleteMany({});
    const usernames = ["duwihartati", "abdulaziz"];

    const permitTemplates = {
      duwihartati: [
        {
          type: "SAKIT",
          date: new Date("2026-07-02"),
          reason: "Demam tinggi dan istirahat sesuai anjuran dokter.",
          status: "APPROVED",
        },
        {
          type: "KEPERLUAN_KELUARGA",
          date: new Date("2026-07-08"),
          reason: "Menghadiri acara keluarga yang tidak dapat ditinggalkan.",
          status: "APPROVED",
        },
        {
          type: "PENTING",
          date: new Date("2026-07-11"),
          reason: "Mengurus dokumen administrasi penting.",
          status: "PENDING",
        },
      ],

      abdulaziz: [
        {
          type: "MUSIBAH",
          date: new Date("2026-07-12"),
          reason: "Menghadiri pemakaman anggota keluarga.",
          status: "APPROVED",
        },
        {
          type: "KEPERLUAN_MENDESAK",
          date: new Date("2026-07-07"),
          reason: "Ada keperluan mendesak yang harus diselesaikan.",
          status: "APPROVED",
        },
        {
          type: "LAINNYA",
          date: new Date("2026-07-10"),
          reason: "Keperluan pribadi.",
          status: "REJECTED",
          notesByApprover: "Alasan belum cukup jelas.",
        },
      ],
    };

    for (const username of usernames) {
      const user = await User.findOne({ username });

      if (!user) {
        console.log(`❌ User ${username} tidak ditemukan.`);
        continue;
      }

      const employee = await Employee.findOne({ userId: user._id });

      if (!employee) {
        console.log(`❌ Employee ${username} tidak ditemukan.`);
        continue;
      }

      await Permit.deleteMany({
        employeeId: employee._id,
        date: {
          $gte: new Date("2026-06-01"),
          $lte: new Date("2026-07-31"),
        },
      });

      const permits = permitTemplates[username].map((item) => ({
        employeeId: employee._id,
        type: item.type,
        date: item.date,
        reason: item.reason,
        status: item.status,
        approvedBy:
          item.status === "APPROVED" || item.status === "REJECTED"
            ? employee._id 
            : null,
        approvalDate:
          item.status === "APPROVED" || item.status === "REJECTED"
            ? new Date(item.date.getTime() + 1000 * 60 * 60 * 4)
            : null,
        notesByApprover: item.notesByApprover || null,
      }));

      await Permit.insertMany(permits);

      console.log(
        `✅ ${permits.length} permit berhasil dibuat untuk ${employee.fullName} (${username})`
      );
    }

    console.log("🎉 Seed permit selesai.");
  } catch (error) {
    console.error("Gagal seed permit:", error);
  }
};

export default seedPermit;
