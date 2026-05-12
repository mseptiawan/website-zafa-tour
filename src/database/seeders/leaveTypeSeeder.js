import mongoose from "mongoose";
import LeaveType from "../../models/LeaveType.js";
import dotenv from "dotenv";

dotenv.config();
const seedLeaveType = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const count = await LeaveType.countDocuments();

    console.log("Current LeaveType count:", count);

    if (count > 0) {
      console.log("LeaveType already seeded");
      process.exit();
    }

    await LeaveType.insertMany([
      {
        name: "Tahunan",
        maxDays: 12,
        requiresAttachment: false,
        isActive: true,
        description: "Cuti tahunan karyawan",
      },
      {
        name: "Sakit",
        maxDays: null,
        requiresAttachment: true,
        isActive: true,
        description: "Izin sakit",
      },
      {
        name: "Keluarga",
        maxDays: 3,
        requiresAttachment: false,
        isActive: true,
        description: "Urusan keluarga",
      },
    ]);

    console.log("Seed success");

    process.exit();
  } catch (err) {
    console.log(err.message);
    process.exit(1);
  }
};

seedLeaveType();
