import User from "../../models/basic/User.js";
import LeaveBalance from "../../models/leave/LeaveBalance.model.js";

const leaveBalanceSeeder = async () => {
  const TARGET_YEAR = 2026;
  const DEFAULT_QUOTA = 12;

  const users = await User.find({});

  let createdCount = 0;
  let skippedCount = 0;

  for (const user of users) {
    const existingBalance = await LeaveBalance.findOne({
      userId: user._id,
      year: TARGET_YEAR,
    });

    if (!existingBalance) {
      await LeaveBalance.create({
        userId: user._id,
        year: TARGET_YEAR,
        totalQuota: DEFAULT_QUOTA,
        remaining: DEFAULT_QUOTA,
      });
      createdCount++;
    } else {
      skippedCount++;
    }
  }

  console.log("==================================================");
  console.log(`   SEEDING SALDO CUTI TAHUN ${TARGET_YEAR} SELESAI`);
  console.log(`   Berhasil dibuat baru : ${createdCount} user`);
  console.log(`   Dilewati (Sudah ada)  : ${skippedCount} user`);
  console.log("==================================================");
};

export default leaveBalanceSeeder;
