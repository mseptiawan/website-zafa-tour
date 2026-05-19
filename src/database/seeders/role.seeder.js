import Role from "../../models/Role.js";

const roleSeeder = async () => {
  await Role.deleteMany();

  await Role.insertMany([
    {
      name: "HR",
    },

    {
      name: "Manager",
    },

    {
      name: "Pimpinan",
    },

    {
      name: "Karyawan",
    },

    {
      name: "Keuangan",
    },
  ]);

  console.log("Role seeded");
};

export default roleSeeder;
