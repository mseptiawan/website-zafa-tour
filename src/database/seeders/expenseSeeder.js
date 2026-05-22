import mongoose from "mongoose";
import ExpenseClaim from "../../models/ExpenseClaim.js";
import User from "../../models/User.js";
import Employee from "../../models/Employee.js";

// =========================
// CONFIG & TARGET USERS
// =========================
const MONGO_URI = "mongodb://localhost:27017/hris_zafa_tour"; // Sesuaikan
const usernames = [
  "basoherman",
  "ongkidwi",
  "sarwanto",
  "duwihartati",
  "ronaldrizky",
  "fadhilah",
  "fajarjaniko",
  "meltisundari",
  "rafikafitrianti",
];

const categories = ["TRANSPORT", "MEAL", "HOTEL", "PARKING", "OPERASIONAL", "LAINNYA"];

// =========================
// HELPERS
// =========================
function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate() {
  const start = new Date(2026, 0, 1);
  const end = new Date(2026, 4, 30);
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// =========================
// MAIN SEED FUNCTION
// =========================
const seedExpenses = async () => {
  try {
    // 1. Konek ke DB
    await mongoose.connect(MONGO_URI);
    console.log("Database connected successfully for seeding...");

    // 2. Cari user
    const users = await User.find({ username: { $in: usernames } });
    if (!users.length) {
      console.log("Tidak ada user ditemukan. Seeding dibatalkan.");
      return;
    }

    // 3. Hapus data lama
    await ExpenseClaim.deleteMany({});
    console.log("Data klaim lama dibersihkan.");

    const data = [];

    // 4. Proses generate 40 data per user
    for (const user of users) {
      const employee = await Employee.findOne({ userId: user._id });

      for (let i = 0; i < 40; i++) {
        const amount = Math.floor(Math.random() * 500000) + 50000;
        const date = randomDate();

        data.push({
          userId: user._id,
          employeeId: employee ? employee._id : null,
          title: `Klaim Operasional ${i + 1} - ${user.username}`,
          category: randomItem(categories),
          amount: amount,
          expenseDate: date,
          status: amount > 200000 ? "PENDING_MANAGER" : "PENDING_FINANCE",
          selfDeclaration: false,
          createdAt: date,
          updatedAt: new Date(),
        });
      }
      console.log(`Prepared 40 data untuk: ${user.username}`);
    }

    // 5. Insert
    await ExpenseClaim.insertMany(data);
    console.log("Expense Seeder COMPLETE!");
  } catch (err) {
    console.error("Error Seeding:", err);
  } finally {
    // 6. Tutup koneksi agar script selesai
    await mongoose.disconnect();
    console.log("Database connection closed.");
  }
};

seedExpenses();
