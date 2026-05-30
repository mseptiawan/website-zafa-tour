import Role from "../../models/basic/Role.model.js";

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
      name: "MANAGER_KEUANGAN",
    },
    {
      name: "MANAGER_HAJI_UMRAH",
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
