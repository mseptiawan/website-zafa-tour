import Bidang from "../../models/basic/Bidang.js";
import Unit from "../../models/basic/Unit.js";

const unitSeeder = async () => {
  await Unit.deleteMany();

  // ======================
  // GET BIDANG
  // ======================

  const administrasi = await Bidang.findOne({
    name: "Administrasi",
  });

  const hajiUmrah = await Bidang.findOne({
    name: "Haji dan Umrah",
  });

  const itMultimedia = await Bidang.findOne({
    name: "IT dan Multimedia",
  });

  const keuangan = await Bidang.findOne({
    name: "Keuangan",
  });

  const marketing = await Bidang.findOne({
    name: "Marketing dan Kemitraan",
  });

  const umumPerlengkapan = await Bidang.findOne({
    name: "Umum dan Perlengkapan",
  });

  // ======================
  // INSERT UNITS
  // ======================

  await Unit.insertMany([
    // ==================================================
    // ADMINISTRASI
    // ==================================================
    {
      bidangId: administrasi._id,
      name: "Manajemen Administrasi",
    },
    {
      bidangId: administrasi._id,
      name: "Ticketing dan Haji Khusus",
    },

    {
      bidangId: administrasi._id,
      name: "Customer Service",
    },

    {
      bidangId: administrasi._id,
      name: "Pelaporan Umrah dan Transportasi",
    },

    {
      bidangId: administrasi._id,
      name: "Online Customer Care",
    },

    // ==================================================
    // HAJI DAN UMRAH
    // ==================================================

    {
      bidangId: hajiUmrah._id,
      name: "Visa dan Hotel",
    },

    {
      bidangId: hajiUmrah._id,
      name: "Pelayanan Saudi",
    },

    {
      bidangId: hajiUmrah._id,
      name: "Pendidikan dan Pelatihan",
    },

    // ==================================================
    // IT DAN MULTIMEDIA
    // ==================================================

    {
      bidangId: itMultimedia._id,
      name: "Multimedia",
    },

    // ==================================================
    // KEUANGAN
    // ==================================================

    {
      bidangId: keuangan._id,
      name: "Accounting",
    },

    {
      bidangId: keuangan._id,
      name: "Pengeluaran COGS",
    },

    {
      bidangId: keuangan._id,
      name: "Penerimaan dan Penagihan",
    },

    {
      bidangId: keuangan._id,
      name: "Pengeluaran Operasional",
    },

    {
      bidangId: keuangan._id,
      name: "Penerimaan Storan Pembayaran",
    },

    // ==================================================
    // MARKETING DAN KEMITRAAN
    // ==================================================

    {
      bidangId: marketing._id,
      name: "Marketing dan Kemitraan",
    },
    {
      bidangId: umumPerlengkapan._id,
      name: "Perlengkapan",
    },
  ]);

  console.log("Units seeded");
};

export default unitSeeder;
