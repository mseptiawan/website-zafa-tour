import Bidang from "../../models/basic/Bidang.model.js";
import Role from "../../models/basic/Role.model.js";

const bidangSeeder = async () => {
  await Bidang.deleteMany();
  const managerKeuangan = await Role.findOne({
    name: "MANAGER_KEUANGAN",
  });

  const managerAdministrasi = await Role.findOne({
    name: "MANAGER_ADMINISTRASI",
  });

  const managerHajiUmrah = await Role.findOne({
    name: "MANAGER_HAJI_UMRAH",
  });

  const wakilDirektur = await Role.findOne({
    name: "WAKIL_DIREKTUR",
  });
  await Bidang.insertMany([
    {
      name: "Keuangan",
      managerRoleId: managerKeuangan._id,
    },

    {
      name: "Marketing dan Kemitraan",
      managerRoleId: wakilDirektur._id,
    },

    {
      name: "Administrasi",
      managerRoleId: managerAdministrasi._id,
    },

    {
      name: "Haji dan Umrah",
      managerRoleId: managerHajiUmrah._id,
    },

    {
      name: "IT dan Multimedia",
      managerRoleId: wakilDirektur._id,
    },

    {
      name: "Umum dan Perlengkapan",
      managerRoleId: wakilDirektur._id,
    },
  ]);

  console.log("Bidang seeded");
};

export default bidangSeeder;
