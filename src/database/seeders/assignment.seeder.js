import Assignment from "../../models/Assignment.js";
import User from "../../models/basic/User.js";
import Employee from "../../models/employee/Employee.model.js";

const usernames = ["basoherman", "ongkidwi", "sarwanto", "duwihartati", "ronaldrizky", "fadhilah"];

const titles = [
  "Menghadiri Rapat Koordinasi",
  "Pelatihan Sistem HRIS",
  "Kunjungan Cabang Area Selatan",
  "Workshop Pengembangan SDM",
  "Pendampingan Audit Internal",
  "Meeting Evaluasi Bulanan",
  "Undangan Seminar Teknologi",
  "Pelatihan Administrasi Digital",
  "Survey Operasional Lapangan",
  "Sosialisasi Kebijakan Baru",
];

const descriptions = [
  "Peserta diwajibkan hadir sesuai jadwal yang telah ditentukan.",
  "Kegiatan dilaksanakan untuk meningkatkan koordinasi dan efektivitas kerja.",
  "Harap membawa dokumen pendukung selama kegiatan berlangsung.",
  "Seluruh peserta wajib mengikuti agenda hingga selesai.",
  "Kegiatan ini merupakan bagian dari program internal perusahaan.",
];

const locations = [
  "Jakarta",
  "Bandung",
  "Palembang",
  "Surabaya",
  "Yogyakarta",
  "Medan",
  "Kantor Pusat",
  "Ruang Meeting Lt. 3",
];

const types = ["UNDANGAN", "INTERNAL", "TRAINING", "LAINNYA"];

const attachments = [
  null,
  null,
  "/uploads/assignment/surat1.pdf",
  "/uploads/assignment/surat2.pdf",
  "/uploads/assignment/surat3.jpg",
];

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate() {
  const start = new Date(2026, 0, 1);
  const end = new Date(2026, 5, 30);
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomEmployees(arr) {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  const total = Math.floor(Math.random() * 5) + 1;
  return shuffled.slice(0, total).map((e) => e._id);
}

export default async function assignmentSeeder() {
  try {
    const users = await User.find({
      username: { $in: usernames },
    });

    const employees = await Employee.find();

    if (!users.length) {
      console.log("User tidak ditemukan");
      return;
    }

    if (!employees.length) {
      console.log("Employee tidak ditemukan");
      return;
    }

    await Assignment.deleteMany({});

    const data = [];

    for (const user of users) {
      for (let i = 0; i < 12; i++) {
        const startDate = randomDate();
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + Math.floor(Math.random() * 4));

        data.push({
          title: randomItem(titles),
          description: randomItem(descriptions),
          type: randomItem(types),
          location: randomItem(locations),
          startDate,
          endDate,
          attachment: randomItem(attachments),
          createdBy: user._id,
          employees: randomEmployees(employees),
          reportFile: Math.random() > 0.75 ? "/uploads/report/laporan-kegiatan.pdf" : null,
          createdAt: randomDate(),
          updatedAt: new Date(),
        });
      }
    }

    await Assignment.insertMany(data);
    console.log("Seeder Assignment COMPLETE");
  } catch (err) {
    console.error(err);
  }
}
