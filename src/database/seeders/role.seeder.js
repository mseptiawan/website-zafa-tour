import Role from "../../models/Role.js";

const roleSeeder = async () => {
  await Role.deleteMany();

  await Role.insertMany([
    {
      name: "PEGAWAI",
    },

    {
      name: "MANAGER_KEUANGAN",
    },

    {
      name: "MANAGER_ADMINISTRASI",
    },
    {
      name: "WAKIL_DIREKTUR",
    },
    {
      name: "DIREKTUR_UTAMA",
    },
  ]);

  console.log("Role seeded");
};

export default roleSeeder;
