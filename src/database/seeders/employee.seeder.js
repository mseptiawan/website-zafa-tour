import User from "../../models/User.js";
import Employee from "../../models/Employee.js";
import Position from "../../models/Position.js";
import Unit from "../../models/Unit.js";
import Bidang from "../../models/Bidang.js";

const employeeSeeder = async () => {
  await Employee.deleteMany();

  // =====================
  // POSITION
  // =====================
  const komisaris = await Position.findOne({ name: "Komisaris" });
  const direkturUtama = await Position.findOne({ name: "Direktur Utama" });
  const wakilDirektur = await Position.findOne({ name: "Wakil Direktur" });
  const generalManager = await Position.findOne({ name: "General Manager" });
  const manager = await Position.findOne({ name: "Manager" });
  const staff = await Position.findOne({ name: "Staff" });

  // =====================
  // BIDANG
  // =====================
  const administrasi = await Bidang.findOne({ name: "Administrasi" });
  const keuangan = await Bidang.findOne({ name: "Keuangan" });
  const marketing = await Bidang.findOne({ name: "Marketing dan Kemitraan" });
  const hajiUmrah = await Bidang.findOne({ name: "Haji dan Umrah" });
  const umum = await Bidang.findOne({ name: "Umum dan Perlengkapan" });
  const it = await Bidang.findOne({ name: "IT dan Multimedia" });

  const manajemenAdministrasi = await Unit.findOne({
    name: "Manajemen Administrasi",
  });
  const ticketingHajiKhusus = await Unit.findOne({
    name: "Ticketing dan Haji Khusus",
  });
  const pelaporanUmrahTransportasi = await Unit.findOne({
    name: "Pelaporan Umrah dan Transportasi",
  });
  const onlineCustomerCare = await Unit.findOne({
    name: "Online Customer Care",
  });

  const pelayananSaudi = await Unit.findOne({ name: "Pelayanan Saudi" });
  const pendidikanPelatihan = await Unit.findOne({
    name: "Pendidikan dan Pelatihan",
  });

  const multimedia = await Unit.findOne({ name: "Multimedia" });

  const pengeluaranCOGS = await Unit.findOne({ name: "Pengeluaran COGS" });
  const penerimaanPenagihan = await Unit.findOne({
    name: "Penerimaan dan Penagihan",
  });
  const pengeluaranOperasional = await Unit.findOne({
    name: "Pengeluaran Operasional",
  });
  const penerimaanStoran = await Unit.findOne({
    name: "Penerimaan Storan Pembayaran",
  });

  const marketingUnit = await Unit.findOne({ name: "Marketing dan Kemitraan" });

  const cs = await Unit.findOne({ name: "Customer Service" });

  const visaHotel = await Unit.findOne({ name: "Visa dan Hotel" });
  const accounting = await Unit.findOne({ name: "Accounting" });

  const perlengkapan = await Unit.findOne({ name: "Perlengkapan" });

  // =====================
  // USERS
  // =====================
  // ================= EMPLOYEE USERS =================

  const gustidiansyah = await User.findOne({ username: "gustidiansyah" });
  const willycauza = await User.findOne({ username: "willycauza" });
  const rafikafitrianti = await User.findOne({ username: "rafikafitrianti" });
  const duwihartati = await User.findOne({ username: "duwihartati" });
  const ronaldrizky = await User.findOne({ username: "ronaldrizky" });
  const meltisundari = await User.findOne({ username: "meltisundari" });
  const fadhilah = await User.findOne({ username: "fadhilah" });
  const mriskywindinata = await User.findOne({ username: "mriskywindinata" });
  const lilymustikasari = await User.findOne({ username: "lilymustikasari" });
  const febriansyah = await User.findOne({ username: "febriansyah" });
  const adindarismayani = await User.findOne({ username: "adindarismayani" });
  const fajarjaniko = await User.findOne({ username: "fajarjaniko" });
  const rendijalil = await User.findOne({ username: "rendijalil" });
  const abdulaziz = await User.findOne({ username: "abdulaziz" });
  const basoherman = await User.findOne({ username: "basoherman" });
  const ongkidwi = await User.findOne({ username: "ongkidwi" });
  const sarwanto = await User.findOne({ username: "sarwanto" });
  const dirasuhada = await User.findOne({ username: "dirasuhada" });
  const muliaeka = await User.findOne({ username: "muliaeka" });
  const dinaanggraini = await User.findOne({ username: "dinaanggraini" });
  const nurul = await User.findOne({ username: "nurul" });
  const arifsuprastiyo = await User.findOne({ username: "arifsuprastiyo" });
  const deckycaprianus = await User.findOne({ username: "deckycaprianus" });
  const adikurniadi = await User.findOne({ username: "adikurniadi" });
  const nicoyudhira = await User.findOne({ username: "nicoyudhira" });
  const mariani = await User.findOne({ username: "mariani" });
  const adipuja = await User.findOne({ username: "adipuja" });

  // =====================
  // DIRECT INSERT EMPLOYEE
  // =====================

  await Employee.insertMany([
    {
      userId: rafikafitrianti._id,
      fullName: "Rafika Fitrianti",
      positionId: direkturUtama._id,
      unitId: null,
      bidangId: null,
    },
    {
      userId: duwihartati._id,
      fullName: "Duwi Hartati",

      positionId: wakilDirektur._id,
      unitId: null,
      bidangId: null,
    },
    {
      userId: ronaldrizky._id,
      fullName: "Ronald Rizky",

      positionId: generalManager._id,
      unitId: null,
      bidangId: null,
    },
    {
      userId: meltisundari._id,
      fullName: "Melti Sundari",

      positionId: manager._id,
      unitId: manajemenAdministrasi._id,
      bidangId: administrasi._id,
    },
    {
      userId: fadhilah._id,
      fullName: "Fadhilah",

      positionId: staff._id,
      unitId: pengeluaranOperasional._id,
      bidangId: keuangan._id,
    },

    // =====================
    // ADMINISTRASI
    // =====================

    {
      userId: gustidiansyah._id,
      fullName: "Gusti Diansyah",

      positionId: komisaris._id,
      unitId: null,
      bidangId: null,
    },
    {
      userId: willycauza._id,
      fullName: "Willy Cauza",

      positionId: generalManager._id,
      unitId: null,
      bidangId: null,
    },
    {
      userId: mriskywindinata._id,
      fullName: "Mrisky Windinata",

      positionId: staff._id,
      unitId: ticketingHajiKhusus._id,
      bidangId: administrasi._id,
    },
    {
      userId: lilymustikasari._id,
      fullName: "Lily Mustikasari",

      positionId: staff._id,
      unitId: cs._id,
      bidangId: administrasi._id,
    },

    // =====================
    // KEUANGAN
    // =====================

    {
      userId: febriansyah._id,
      fullName: "Febriansyah",

      positionId: staff._id,
      unitId: pelaporanUmrahTransportasi._id,
      bidangId: administrasi._id,
    },
    {
      userId: adindarismayani._id,
      fullName: "Adinda Rismayani",

      positionId: staff._id,
      unitId: onlineCustomerCare._id,
      bidangId: administrasi._id,
    },
    {
      userId: fajarjaniko._id,
      fullName: "Fajar Janiko",

      positionId: staff._id,
      unitId: cs._id,
      bidangId: administrasi._id,
    },
    {
      userId: rendijalil._id,
      fullName: "Rendi Jalil",

      positionId: staff._id,
      unitId: visaHotel._id,
      bidangId: hajiUmrah._id,
    },

    // =====================
    // Haji & Umrah
    // =====================

    {
      userId: abdulaziz._id,
      fullName: "Abdul Aziz",

      positionId: staff._id,
      unitId: pelayananSaudi._id,
      bidangId: hajiUmrah._id,
    },
    {
      userId: basoherman._id,
      fullName: "Baso Herman",

      positionId: staff._id,
      unitId: pendidikanPelatihan._id,
      bidangId: hajiUmrah._id,
    },
    {
      userId: ongkidwi._id,
      fullName: "Ongki Dwi",

      positionId: staff._id,
      unitId: multimedia._id,
      bidangId: it._id,
    },

    // =====================
    // IT
    // =====================

    {
      userId: sarwanto._id,
      fullName: "Sarwanto",

      positionId: staff._id,
      unitId: multimedia._id,
      bidangId: it._id,
    },

    // =====================
    // MARKETING
    // =====================

    {
      userId: dirasuhada._id,
      fullName: "Dira Suhada",

      positionId: staff._id,
      unitId: accounting._id,
      bidangId: keuangan._id,
    },
    {
      userId: muliaeka._id,
      fullName: "Mulia Eka",

      positionId: staff._id,
      unitId: pengeluaranCOGS._id,
      bidangId: keuangan._id,
    },

    // =====================
    // UMUM
    // =====================

    {
      userId: dinaanggraini._id,
      fullName: "Dina Anggraini",

      positionId: staff._id,
      unitId: penerimaanPenagihan._id,
      bidangId: keuangan._id,
    },
    {
      userId: nurul._id,
      fullName: "Nurul",

      positionId: staff._id,
      unitId: penerimaanStoran._id,
      bidangId: keuangan._id,
    },

    // =====================
    // SUPPORT / GENERAL STAFF
    // =====================

    {
      userId: arifsuprastiyo._id,
      fullName: "Arif Suprastiyo",

      positionId: staff._id,
      unitId: marketingUnit._id,
      bidangId: marketing._id,
    },
    {
      userId: deckycaprianus._id,
      fullName: "Decky Caprianus",

      positionId: staff._id,
      unitId: marketingUnit._id,
      bidangId: marketing._id,
    },
    {
      userId: adikurniadi._id,
      fullName: "Adi Kurniadi",

      positionId: staff._id,
      unitId: marketingUnit._id,
      bidangId: marketing._id,
    },
    {
      userId: nicoyudhira._id,
      fullName: "Nico Yudhira",

      positionId: staff._id,
      unitId: perlengkapan._id,
      bidangId: umum._id,
    },
    {
      userId: mariani._id,
      fullName: "Mariani",

      positionId: staff._id,
      unitId: perlengkapan._id,
      bidangId: umum._id,
    },
    {
      userId: adipuja._id,
      fullName: "Adi Puja",

      positionId: staff._id,
      unitId: perlengkapan._id,
      bidangId: umum._id,
    },
  ]);

  console.log("Employee seeded (STATIC VERSION)");
};

export default employeeSeeder;
