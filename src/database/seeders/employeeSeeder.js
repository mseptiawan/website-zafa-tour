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

  // =====================
  // UNIT (minimal mapping)
  // =====================
  const cs = await Unit.findOne({ name: "Customer Service" });
  const accounting = await Unit.findOne({ name: "Accounting" });
  const marketingUnit = await Unit.findOne({ name: "Marketing dan Kemitraan" });
  const perlengkapan = await Unit.findOne({ name: "Perlengkapan" });
  const visaHotel = await Unit.findOne({ name: "Visa dan Hotel" });

  // =====================
  // USERS
  // =====================
  const gusti = await User.findOne({ email: "gusti@zafa.com" });
  const rafika = await User.findOne({ email: "rafika@zafa.com" });
  const duwi = await User.findOne({ email: "duwi@zafa.com" });
  const ronald = await User.findOne({ email: "ronald@zafa.com" });
  const willy = await User.findOne({ email: "willy@zafa.com" });

  const melti = await User.findOne({ email: "melti@zafa.com" });
  const mrisky = await User.findOne({ email: "mrisky@zafa.com" });
  const fadhilah = await User.findOne({ email: "fadhilah@zafa.com" });

  const febriansyah = await User.findOne({ email: "febriansyah@zafa.com" });
  const adinda = await User.findOne({ email: "adinda@zafa.com" });

  const dina = await User.findOne({ email: "dina@zafa.com" });
  const nurul = await User.findOne({ email: "nurul@zafa.com" });

  const decky = await User.findOne({ email: "decky@zafa.com" });

  // =====================
  // DIRECT INSERT EMPLOYEE
  // =====================

  await Employee.insertMany([
    // =====================
    // TOP MANAGEMENT
    // =====================
    {
      userId: gusti._id,
      fullName: "gusti",
      employeeCode: "EMP-001",
      positionId: komisaris._id,
      unitId: null,
      bidangId: null,
    },
    {
      userId: rafika._id,
      fullName: "rafika",
      employeeCode: "EMP-002",
      positionId: direkturUtama._id,
      unitId: null,
      bidangId: null,
    },
    {
      userId: duwi._id,
      fullName: "duwi hartati",
      employeeCode: "EMP-003",
      positionId: wakilDirektur._id,
      unitId: null,
      bidangId: null,
    },

    // =====================
    // GENERAL MANAGER
    // =====================
    {
      userId: ronald._id,
      fullName: "ronald",
      employeeCode: "EMP-004",
      positionId: generalManager._id,
      unitId: accounting._id,
      bidangId: keuangan._id,
    },
    {
      userId: willy._id,
      fullName: "willy",
      employeeCode: "EMP-005",
      positionId: generalManager._id,
      unitId: cs._id,
      bidangId: administrasi._id,
    },

    // =====================
    // MANAGER
    // =====================
    {
      userId: melti._id,
      fullName: "melti sundari",
      employeeCode: "EMP-006",
      positionId: manager._id,
      unitId: marketingUnit._id,
      bidangId: marketing._id,
    },

    // =====================
    // STAFF ADMIN
    // =====================
    {
      userId: mrisky._id,
      fullName: "mrisky",
      employeeCode: "EMP-007",
      positionId: staff._id,
      unitId: cs._id,
      bidangId: administrasi._id,
    },
    // =====================
    // KEUANGAN
    // =====================
    {
      userId: fadhilah._id,
      fullName: "fadhilah",
      employeeCode: "EMP-008",
      positionId: staff._id,
      unitId: accounting._id,
      bidangId: keuangan._id,
    },

    // =====================
    // UMRAH
    // =====================
    {
      userId: febriansyah._id,
      fullName: "febriansyah",
      employeeCode: "EMP-009",
      positionId: staff._id,
      unitId: visaHotel._id,
      bidangId: hajiUmrah._id,
    },
    {
      userId: adinda._id,
      fullName: "adinda",
      employeeCode: "EMP-010",
      positionId: staff._id,
      unitId: visaHotel._id,
      bidangId: hajiUmrah._id,
    },
    // =====================
    // MARKETING
    // =====================
    {
      userId: dina._id,
      fullName: "dina",
      employeeCode: "EMP-011",
      positionId: staff._id,
      unitId: marketingUnit._id,
      bidangId: marketing._id,
    },
    {
      userId: nurul._id,
      fullName: "nurul",
      employeeCode: "EMP-012",
      positionId: staff._id,
      unitId: marketingUnit._id,
      bidangId: marketing._id,
    },

    // =====================
    // UMUM
    // =====================
    {
      userId: decky._id,
      fullName: "decky",
      employeeCode: "EMP-013",
      positionId: staff._id,
      unitId: perlengkapan._id,
      bidangId: umum._id,
    },
  ]);

  console.log("Employee seeded (STATIC VERSION)");
};

export default employeeSeeder;
