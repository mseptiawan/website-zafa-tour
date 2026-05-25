import Role from "../../models/basic/Role.js";

const roleSeeder = async () => {
  await Role.deleteMany();

  await Role.insertMany([
    {
      name: "PEGAWAI",
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

    {
      name: "MANAGER_KEUANGAN",
    },
  ]);

  console.log("Role seeded");
};

export default roleSeeder;
