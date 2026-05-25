import KpiTemplate from "../../models/kpi/KpiTemplate.js";

const kpiTemplateSeeder = async () => {
  await KpiTemplate.deleteMany();

  await KpiTemplate.insertMany([
    {
      name: "Manager Bidang Administrasi",
    },

    {
      name: "Staff Bidang Administrasi (Unit Customer Service)",
    },

    {
      name: "Staff Bidang Administrasi (Unit Pelaporan Jamaah dan Transportasi)",
    },

    {
      name: "Staff Bidang Administrasi (Unit Online Customer Service)",
    },

    {
      name: "Staff Bidang Administrasi (Unit Ticketing dan Administrasi Haji)",
    },

    {
      name: "Staff Bidang Umrah (Unit Visa dan Hotel)",
    },

    {
      name: "Staff Bidang Umrah (Unit Pelayanan Land Arrangement)",
    },

    {
      name: "Staff Bidang Umrah (Unit Edukasi Jamaah dan Alumni)",
    },

    {
      name: "Unit Penerimaan dan Penagihan",
    },

    {
      name: "Unit Penerimaan Tunai dan Non Tunai",
    },

    {
      name: "Unit Tax and Accounting",
    },

    {
      name: "Unit Pengeluaran COGS",
    },

    {
      name: "Unit Pengeluaran Operasional Harian",
    },

    {
      name: "Staff Perlengkapan dan Pemeliharaan Gedung",
    },

    {
      name: "Staff Bidang Marketing dan Perlengkapan",
    },
  ]);

  console.log("KPI Templates seeded");
};

export default kpiTemplateSeeder;
