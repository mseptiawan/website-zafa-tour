import Bidang from "../../models/Bidang.js";
import Unit from "../../models/Unit.js";

const unitSeeder = async () => {
  await Unit.deleteMany();

  const marketing = await Bidang.findOne({
    name: "Marketing",
  });

  const administrasi = await Bidang.findOne({
    name: "Administrasi",
  });

  const keuangan = await Bidang.findOne({
    name: "Keuangan",
  });

  await Unit.insertMany([
    {
      bidangId: marketing._id,
      name: "Sales",
    },

    {
      bidangId: marketing._id,
      name: "Customer Service",
    },

    {
      bidangId: administrasi._id,
      name: "Arsip",
    },

    {
      bidangId: administrasi._id,
      name: "Payroll",
    },

    {
      bidangId: keuangan._id,
      name: "Finance",
    },
  ]);

  console.log("Unit seeded");
};

export default unitSeeder;
