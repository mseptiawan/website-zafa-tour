import User from "../../models/basic/User.model.js";
import Employee from "../../models/employee/Employee.model.js";
import Position from "../../models/basic/Position.model.js";
import Unit from "../../models/basic/Unit.model.js";
import Bidang from "../../models/basic/Bidang.model.js";
import EmployeeCareer from "../../models/employee/EmployeeCareer.js";

const employeeSeeder = async () => {
  await Employee.deleteMany();
  await EmployeeCareer.deleteMany();

  const komisaris = await Position.findOne({ name: "Komisaris" });
  const direkturUtama = await Position.findOne({ name: "Direktur Utama" });
  const wakilDirektur = await Position.findOne({ name: "Wakil Direktur" });
  const generalManager = await Position.findOne({ name: "General Manager" });
  const manager = await Position.findOne({ name: "Manager" });
  const pegawai = await Position.findOne({ name: "Pegawai" });

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

  const rawEmployees = [
    {
      userId: rafikafitrianti._id,
      fullName: "Rafika Fitrianti",
      gender: "Perempuan",
      positionId: direkturUtama._id,
      unitId: null,
      bidangId: null,
    },
    {
      userId: duwihartati._id,
      fullName: "Duwi Hartati",
      gender: "Perempuan",
      positionId: wakilDirektur._id,
      unitId: null,
      bidangId: null,
    },
    {
      userId: ronaldrizky._id,
      fullName: "Ronald Rizky",
      gender: "Laki-Laki",
      positionId: generalManager._id,
      unitId: null,
      bidangId: null,
    },
    {
      userId: meltisundari._id,
      fullName: "Melti Sundari",
      gender: "Perempuan",
      positionId: manager._id,
      unitId: manajemenAdministrasi._id,
      bidangId: administrasi._id,
    },
    {
      userId: fadhilah._id,
      fullName: "Fadhilah",
      gender: "Perempuan",
      positionId: pegawai._id,
      unitId: pengeluaranOperasional._id,
      bidangId: keuangan._id,
    },

    {
      userId: gustidiansyah._id,
      fullName: "Gusti Diansyah",
      gender: "Laki-Laki",
      positionId: komisaris._id,
      unitId: null,
      bidangId: null,
    },
    {
      userId: willycauza._id,
      fullName: "Willy Cauza",
      gender: "Laki-Laki",
      positionId: generalManager._id,
      unitId: null,
      bidangId: null,
    },
    {
      userId: mriskywindinata._id,
      fullName: "Mrisky Windinata",
      gender: "Laki-Laki",
      positionId: pegawai._id,
      unitId: ticketingHajiKhusus._id,
      bidangId: administrasi._id,
    },
    {
      userId: lilymustikasari._id,
      fullName: "Lily Mustikasari",
      gender: "Perempuan",
      positionId: pegawai._id,
      unitId: cs._id,
      bidangId: administrasi._id,
    },

    {
      userId: febriansyah._id,
      fullName: "Febriansyah",
      gender: "Laki-Laki",
      positionId: pegawai._id,
      unitId: pelaporanUmrahTransportasi._id,
      bidangId: administrasi._id,
    },
    {
      userId: adindarismayani._id,
      fullName: "Adinda Rismayani",
      gender: "Perempuan",
      positionId: pegawai._id,
      unitId: onlineCustomerCare._id,
      bidangId: administrasi._id,
    },
    {
      userId: fajarjaniko._id,
      fullName: "Fajar Janiko",
      gender: "Laki-Laki",
      positionId: pegawai._id,
      unitId: cs._id,
      bidangId: administrasi._id,
    },
    {
      userId: rendijalil._id,
      fullName: "Rendi Jalil",
      gender: "Laki-Laki",
      positionId: pegawai._id,
      unitId: visaHotel._id,
      bidangId: hajiUmrah._id,
    },

    {
      userId: abdulaziz._id,
      fullName: "Abdul Aziz",
      gender: "Laki-Laki",
      positionId: pegawai._id,
      unitId: pelayananSaudi._id,
      bidangId: hajiUmrah._id,
    },
    {
      userId: basoherman._id,
      fullName: "Baso Herman",
      gender: "Laki-Laki",
      positionId: pegawai._id,
      unitId: pendidikanPelatihan._id,
      bidangId: hajiUmrah._id,
    },
    {
      userId: ongkidwi._id,
      fullName: "Ongki Dwi",
      gender: "Laki-Laki",
      positionId: pegawai._id,
      unitId: multimedia._id,
      bidangId: it._id,
    },

    {
      userId: sarwanto._id,
      fullName: "Sarwanto",
      gender: "Laki-Laki",
      positionId: pegawai._id,
      unitId: multimedia._id,
      bidangId: it._id,
    },

    {
      userId: dirasuhada._id,
      fullName: "Dira Suhada",
      gender: "Perempuan",
      positionId: pegawai._id,
      unitId: accounting._id,
      bidangId: keuangan._id,
    },
    {
      userId: muliaeka._id,
      fullName: "Mulia Eka",
      gender: "Perempuan",
      positionId: pegawai._id,
      unitId: pengeluaranCOGS._id,
      bidangId: keuangan._id,
    },

    {
      userId: dinaanggraini._id,
      fullName: "Dina Anggraini",
      gender: "Perempuan",
      positionId: pegawai._id,
      unitId: penerimaanPenagihan._id,
      bidangId: keuangan._id,
    },
    {
      userId: nurul._id,
      fullName: "Nurul",
      gender: "Perempuan",
      positionId: pegawai._id,
      unitId: penerimaanStoran._id,
      bidangId: keuangan._id,
    },

    {
      userId: arifsuprastiyo._id,
      fullName: "Arif Suprastiyo",
      gender: "Laki-Laki",
      positionId: pegawai._id,
      unitId: marketingUnit._id,
      bidangId: marketing._id,
    },
    {
      userId: deckycaprianus._id,
      fullName: "Decky Caprianus",
      gender: "Laki-Laki",
      positionId: pegawai._id,
      unitId: marketingUnit._id,
      bidangId: marketing._id,
    },
    {
      userId: adikurniadi._id,
      fullName: "Adi Kurniadi",
      gender: "Laki-Laki",
      positionId: pegawai._id,
      unitId: marketingUnit._id,
      bidangId: marketing._id,
    },
    {
      userId: nicoyudhira._id,
      fullName: "Nico Yudhira",
      gender: "Laki-Laki",
      positionId: pegawai._id,
      unitId: perlengkapan._id,
      bidangId: umum._id,
    },
    {
      userId: mariani._id,
      fullName: "Mariani",
      gender: "Perempuan",
      positionId: pegawai._id,
      unitId: perlengkapan._id,
      bidangId: umum._id,
    },
    {
      userId: adipuja._id,
      fullName: "Adi Puja",
      gender: "Laki-Laki",
      positionId: pegawai._id,
      unitId: perlengkapan._id,
      bidangId: umum._id,
    },
  ];

  for (let i = 0; i < rawEmployees.length; i++) {
    const emp = rawEmployees[i];

    const generatedKtpMentah = `320101${(i + 1).toString().padStart(10, "0")}`;

    const shortIdFromKtp = generatedKtpMentah.slice(-6);
    const professionalId = `ZFT-${shortIdFromKtp}`;

    const newEmployee = await Employee.create({
      userId: emp.userId,
      employeeIdNumber: professionalId,
      fullName: emp.fullName,
      nomor_ktp: generatedKtpMentah,
      tempat_lahir: "Palembang",
      tanggal_lahir: new Date("1998-01-01"),
      jenis_kelamin: emp.gender === "Laki-Laki" ? "Laki-Laki" : "Perempuan",
      agama: "Islam",
      status_pernikahan: "Lajang",
    });

    if (emp.positionId || emp.bidangId || emp.unitId) {
      await EmployeeCareer.create({
        employee_id: newEmployee._id,
        status_karyawan: "Pegawai Tetap",
        tanggal_mulai_bergabung: new Date(),
        bidangId: emp.bidangId || null,
        unitId: emp.unitId || null,
        positionId: emp.positionId || null,
      });
    }
  }

  console.log(
    `Successfully seeded ${rawEmployees.length} employees and profiles into separate career schema.`
  );
};

export default employeeSeeder;
