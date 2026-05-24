import mongoose from "mongoose";
import SalaryComponent from "./models/SalaryComponent.js"; 

const salaryComponents = [
  {
    code: "GAPOK",
    name: "Gaji Pokok",
    type: "FIXED",
    category: "EARNING",
    calculationType: "FIXED_AMOUNT",
    defaultAmount: 0, 
    basedOnComponent: null,
    isLocked: true, 
  },
  {
    code: "TJ_KONSUMSI",
    name: "Tunjangan Konsumsi (Kehadiran)",
    type: "FLEXIBLE", 
    category: "EARNING",
    calculationType: "FIXED_AMOUNT", 
    defaultAmount: 25000, 
    basedOnComponent: "TOTAL_HADIR", 
    isLocked: false,
  },
  {
    code: "TJ_LEMBUR",
    name: "Tunjangan Lembur per Jam",
    type: "FLEXIBLE", 
    category: "EARNING",
    calculationType: "FIXED_AMOUNT",
    defaultAmount: 20000, 
    basedOnComponent: "TOTAL_JAM_LEMBUR", 
    isLocked: false,
  },
  {
    code: "INS_KEROHANIAN",
    name: "Insentif Kerohanian (THR)",
    type: "FLEXIBLE",
    category: "EARNING",
    calculationType: "FIXED_AMOUNT",
    defaultAmount: 0, 
    basedOnComponent: null,
    isLocked: false,
  },
  {
    code: "TJ_KELUARGA",
    name: "Tunjangan Keluarga",
    type: "FIXED",
    category: "EARNING",
    calculationType: "PERCENTAGE",
    defaultAmount: 5, 
    basedOnComponent: "GAPOK", 
    isLocked: false,
  },
  {
    code: "TJ_KOMUNIKASI",
    name: "Tunjangan Komunikasi",
    type: "FIXED",
    category: "EARNING",
    calculationType: "FIXED_AMOUNT",
    defaultAmount: 150000, 
    basedOnComponent: null,
    isLocked: false,
  },
  {
    code: "BONUS",
    name: "Bonus Performa / Insentif",
    type: "FLEXIBLE",
    category: "EARNING",
    calculationType: "FIXED_AMOUNT",
    defaultAmount: 0, 
    basedOnComponent: null,
    isLocked: false,
  },
  {
    code: "POT_BPJS",
    name: "Potongan BPJS Ketenagakerjaan & Kesehatan",
    type: "FIXED",
    category: "DEDUCTION", 
    calculationType: "PERCENTAGE",
    defaultAmount: 3, 
    basedOnComponent: "GAPOK", 
    isLocked: false,
  },
  {
    code: "POT_PPH21",
    name: "Potongan Pajak PPh 21",
    type: "FLEXIBLE", 
    category: "DEDUCTION",
    calculationType: "PERCENTAGE",
    defaultAmount: 5, 
    basedOnComponent: "GAPOK", 
    isLocked: false,
  },
  {
    code: "POT_LOAN",
    name: "Potongan Cicilan Pinjaman",
    type: "FLEXIBLE", 
    category: "DEDUCTION",
    calculationType: "FIXED_AMOUNT",
    defaultAmount: 0, 
    basedOnComponent: null,
    isLocked: true, 
  }
];

const seedSalaryComponents = async () => {
  try {
    await mongoose.connect("mongodb://localhost:27017/hris_database"); 

    await SalaryComponent.deleteMany({});
    console.log("Data komponen lama berhasil dibersihkan.");

    await SalaryComponent.insertMany(salaryComponents);
    console.log("Seeder Berhasil! 10 Komponen Gaji utama telah ditambahkan.");
    
    process.exit();
  } catch (error) {
    console.error("Seeder Gagal:", error);
    process.exit(1);
  }
};

seedSalaryComponents();