import Unit from "../../models/basic/Unit.js";
import Position from "../../models/basic/Position.js";
import KpiTemplate from "../../models/kpi/KpiTemplate.js";
import UnitKpiMapping from "../../models/kpi/UnitKpiMapping.js";

const unitKpiMappingSeeder = async () => {
  await UnitKpiMapping.deleteMany();

  // =========================
  // POSITION
  // =========================

  const pegawai = await Position.findOne({
    name: "Pegawai",
  });
  const manager = await Position.findOne({
    name: "Manager",
  });

  // =========================
  // UNIT
  // =========================
  const manajemenAdministrasi = await Unit.findOne({
    name: "Manajemen Administrasi",
  });

  const customerService = await Unit.findOne({
    name: "Customer Service",
  });

  const pelaporan = await Unit.findOne({
    name: "Pelaporan Umrah dan Transportasi",
  });

  const onlineCustomerCare = await Unit.findOne({
    name: "Online Customer Care",
  });

  const ticketing = await Unit.findOne({
    name: "Ticketing dan Haji Khusus",
  });

  const visaHotel = await Unit.findOne({
    name: "Visa dan Hotel",
  });

  const pelayananSaudi = await Unit.findOne({
    name: "Pelayanan Saudi",
  });

  const pendidikan = await Unit.findOne({
    name: "Pendidikan dan Pelatihan",
  });

  const accounting = await Unit.findOne({
    name: "Accounting",
  });

  const pengeluaranCogs = await Unit.findOne({
    name: "Pengeluaran COGS",
  });

  const penerimaanPenagihan = await Unit.findOne({
    name: "Penerimaan dan Penagihan",
  });

  const pengeluaranOperasional = await Unit.findOne({
    name: "Pengeluaran Operasional",
  });

  const penerimaanStoran = await Unit.findOne({
    name: "Penerimaan Storan Pembayaran",
  });

  const marketing = await Unit.findOne({
    name: "Marketing dan Kemitraan",
  });

  const perlengkapan = await Unit.findOne({
    name: "Perlengkapan",
  });

  // =========================
  // KPI TEMPLATE
  // =========================
  const kpiManagerAdministrasi = await KpiTemplate.findOne({
    name: "Manager Bidang Administrasi",
  });
  const kpiCustomerService = await KpiTemplate.findOne({
    name: "Staff Bidang Administrasi (Unit Customer Service)",
  });

  const kpiPelaporan = await KpiTemplate.findOne({
    name: "Staff Bidang Administrasi (Unit Pelaporan Jamaah dan Transportasi)",
  });

  const kpiOnlineCs = await KpiTemplate.findOne({
    name: "Staff Bidang Administrasi (Unit Online Customer Service)",
  });

  const kpiTicketing = await KpiTemplate.findOne({
    name: "Staff Bidang Administrasi (Unit Ticketing dan Administrasi Haji)",
  });

  const kpiVisa = await KpiTemplate.findOne({
    name: "Staff Bidang Umrah (Unit Visa dan Hotel)",
  });

  const kpiLandArrangement = await KpiTemplate.findOne({
    name: "Staff Bidang Umrah (Unit Pelayanan Land Arrangement)",
  });

  const kpiEdukasi = await KpiTemplate.findOne({
    name: "Staff Bidang Umrah (Unit Edukasi Jamaah dan Alumni)",
  });

  const kpiPenagihan = await KpiTemplate.findOne({
    name: "Unit Penerimaan dan Penagihan",
  });

  const kpiTunai = await KpiTemplate.findOne({
    name: "Unit Penerimaan Tunai dan Non Tunai",
  });

  const kpiAccounting = await KpiTemplate.findOne({
    name: "Unit Tax and Accounting",
  });

  const kpiCogs = await KpiTemplate.findOne({
    name: "Unit Pengeluaran COGS",
  });

  const kpiOperasional = await KpiTemplate.findOne({
    name: "Unit Pengeluaran Operasional Harian",
  });

  const kpiPerlengkapan = await KpiTemplate.findOne({
    name: "Staff Perlengkapan dan Pemeliharaan Gedung",
  });

  const kpiMarketing = await KpiTemplate.findOne({
    name: "Staff Bidang Marketing dan Perlengkapan",
  });

  await UnitKpiMapping.insertMany([
    // ADMINISTRASI
    {
      unitId: manajemenAdministrasi._id,
      positionId: manager._id,
      kpiTemplateId: kpiManagerAdministrasi._id,
    },
    {
      unitId: customerService._id,
      positionId: pegawai._id,
      kpiTemplateId: kpiCustomerService._id,
    },

    {
      unitId: pelaporan._id,
      positionId: pegawai._id,
      kpiTemplateId: kpiPelaporan._id,
    },

    {
      unitId: onlineCustomerCare._id,
      positionId: pegawai._id,
      kpiTemplateId: kpiOnlineCs._id,
    },

    {
      unitId: ticketing._id,
      positionId: pegawai._id,
      kpiTemplateId: kpiTicketing._id,
    },

    // HAJI DAN UMRAH

    {
      unitId: visaHotel._id,
      positionId: pegawai._id,
      kpiTemplateId: kpiVisa._id,
    },

    {
      unitId: pelayananSaudi._id,
      positionId: pegawai._id,
      kpiTemplateId: kpiLandArrangement._id,
    },

    {
      unitId: pendidikan._id,
      positionId: pegawai._id,
      kpiTemplateId: kpiEdukasi._id,
    },

    // KEUANGAN

    {
      unitId: penerimaanPenagihan._id,
      positionId: pegawai._id,
      kpiTemplateId: kpiPenagihan._id,
    },

    {
      unitId: penerimaanStoran._id,
      positionId: pegawai._id,
      kpiTemplateId: kpiTunai._id,
    },

    {
      unitId: accounting._id,
      positionId: pegawai._id,
      kpiTemplateId: kpiAccounting._id,
    },

    {
      unitId: pengeluaranCogs._id,
      positionId: pegawai._id,
      kpiTemplateId: kpiCogs._id,
    },

    {
      unitId: pengeluaranOperasional._id,
      positionId: pegawai._id,
      kpiTemplateId: kpiOperasional._id,
    },

    // MARKETING

    {
      unitId: marketing._id,
      positionId: pegawai._id,
      kpiTemplateId: kpiMarketing._id,
    },

    // PERLENGKAPAN

    {
      unitId: perlengkapan._id,
      positionId: pegawai._id,
      kpiTemplateId: kpiPerlengkapan._id,
    },
  ]);

  console.log("Unit KPI Mappings seeded");
};

export default unitKpiMappingSeeder;
