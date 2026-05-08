import Bidang from "../../models/Bidang.js";

const bidangSeeder = async () => {
  await Bidang.deleteMany();

  await Bidang.insertMany([
    {
      name: "Marketing",
    },

    {
      name: "Administrasi",
    },

    {
      name: "Keuangan",
    },

    {
      name: "HRD",
    },

    {
      name: "Operasional",
    },
  ]);

  console.log("Bidang seeded");
};

export default bidangSeeder;
