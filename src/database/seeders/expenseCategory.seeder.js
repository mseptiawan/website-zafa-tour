import ExpenseCategory from "../../models/ExpenseCategory.model.js";

const expenseCategorySeeder = async () => {
  await ExpenseCategory.deleteMany();

  await ExpenseCategory.insertMany([
    {
      name: "Transport",
      code: "TRANSPORT",
      isActive: true,
    },
    {
      name: "Meal",
      code: "MEAL",
      isActive: true,
    },
    {
      name: "Parking",
      code: "PARKING",
      isActive: true,
    },
    {
      name: "Hotel",
      code: "HOTEL",
      isActive: true,
    },
    {
      name: "Operasional",
      code: "OPERASIONAL",
      isActive: true,
    },
    {
      name: "Lainnya",
      code: "LAINNYA",
      isActive: true,
    },
  ]);

  console.log("Expense Category seeded");
};

export default expenseCategorySeeder;
