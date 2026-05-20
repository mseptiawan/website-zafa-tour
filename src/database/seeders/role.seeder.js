import Role from "../../models/Role.js";

const roleSeeder = async () => {
  await Role.deleteMany();

  await Role.insertMany([
    {
      name: "STAFF",
    },

    {
      name: "MANAGER",
    },

    {
      name: "GENERAL_MANAGER",
    },
    {
      name: "HR",
    },
    {
      name: "PIMPINAN",
    },

    {
      name: "KOMISARIS",
    },

    {
      name: "KEUANGAN",
    },
  ]);

  console.log("Role seeded");
};

export default roleSeeder;
