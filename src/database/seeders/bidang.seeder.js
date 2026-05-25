import Bidang from "../../models/basic/Bidang.js";

const bidangSeeder = async () => {
  await Bidang.deleteMany();

  await Bidang.insertMany([
    {
      name: "Keuangan",
    },

    {
      name: "Marketing dan Kemitraan",
    },

    {
      name: "Administrasi",
    },

    {
      name: "Haji dan Umrah",
    },

    {
      name: "IT dan Multimedia",
    },
    {
      name: "Umum dan Perlengkapan",
    },
  ]);

  console.log("Bidang seeded");
};

export default bidangSeeder;
