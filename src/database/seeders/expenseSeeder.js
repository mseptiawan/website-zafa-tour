import ExpenseClaim from "../../models/ExpenseClaim.js";
import User from "../../models/basic/User.js";
import Employee from "../../models/employee/Employee.model.js";

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
const finalStatuses = ["PENDING_MANAGER", "PENDING_FINANCE", "PAID", "REJECTED"];

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate() {
  const start = new Date(2026, 0, 1);
  const end = new Date(2026, 4, 30);
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

const expenseSeeder = async () => {
  const users = await User.find({ username: { $in: usernames } });
  if (!users.length) {
    console.log("Tidak ada user ditemukan. Seeding expense dibatalkan.");
    return;
  }

  await ExpenseClaim.deleteMany({});

  const data = [];

  for (const user of users) {
    const employee = await Employee.findOne({ userId: user._id });

    for (let i = 0; i < 40; i++) {
      const amount = Math.floor(Math.random() * 500000) + 50000;
      const date = randomDate();
      const status = randomItem(finalStatuses);

      data.push({
        userId: user._id,
        employeeId: employee ? employee._id : null,
        title: `Klaim Operasional ${i + 1} - ${user.username}`,
        category: randomItem(categories),
        amount: amount,
        expenseDate: date,
        status: status,
        selfDeclaration: amount < 100000,
        proofFile: amount >= 100000 ? "nota-kredit.png" : null,
        transferProofFile:
          status === "PAID" && Math.random() > 0.5 ? "file-1779435027076.jpeg" : null,
        paidAt: status === "PAID" ? date : null,
        financeApprovedBy: status === "PAID" ? user._id : null,
        createdAt: date,
        updatedAt: new Date(),
      });
    }
  }

  await ExpenseClaim.insertMany(data);
  console.log("Expense Claim seeded");
};

export default expenseSeeder;
