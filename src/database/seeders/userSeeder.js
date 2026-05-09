import bcrypt from "bcrypt";
import User from "../../models/User.js";
import Role from "../../models/Role.js";

const userSeeder = async () => {
  await User.deleteMany();

  const password = await bcrypt.hash("zafasecret", 10);

  const hrRole = await Role.findOne({ name: "HR" });
  const managerRole = await Role.findOne({ name: "Manager" });
  const pimpinanRole = await Role.findOne({ name: "Pimpinan" });
  const karyawanRole = await Role.findOne({ name: "Karyawan" });
  const keuanganRole = await Role.findOne({ name: "Keuangan" });

  const users = await User.insertMany([
    // ================= PIMPINAN =================
    { email: "rafika@zafa.com", password, roleId: pimpinanRole._id },

    // ================= HR =================
    { email: "duwi@zafa.com", password, roleId: hrRole._id },

    // ================= MANAGER =================
    { email: "ronald@zafa.com", password, roleId: managerRole._id },

    // ================= KEUANGAN =================
    { email: "fadhilah@zafa.com", password, roleId: keuanganRole._id },

    // ================= EMPLOYEE =================
    { email: "gusti@zafa.com", password, roleId: karyawanRole._id },
    { email: "willy@zafa.com", password, roleId: karyawanRole._id },
    { email: "melti@zafa.com", password, roleId: karyawanRole._id },
    { email: "mrisky@zafa.com", password, roleId: karyawanRole._id },
    { email: "lily@zafa.com", password, roleId: karyawanRole._id },
    { email: "febriansyah@zafa.com", password, roleId: karyawanRole._id },
    { email: "adinda@zafa.com", password, roleId: karyawanRole._id },
    { email: "fajar@zafa.com", password, roleId: karyawanRole._id },
    { email: "rendi@zafa.com", password, roleId: karyawanRole._id },
    { email: "abdul@zafa.com", password, roleId: karyawanRole._id },
    { email: "baso@zafa.com", password, roleId: karyawanRole._id },
    { email: "ongki@zafa.com", password, roleId: karyawanRole._id },
    { email: "sarwanto@zafa.com", password, roleId: karyawanRole._id },
    { email: "diras@zafa.com", password, roleId: karyawanRole._id },
    { email: "mulia@zafa.com", password, roleId: karyawanRole._id },
    { email: "dina@zafa.com", password, roleId: karyawanRole._id },
    { email: "nurul@zafa.com", password, roleId: karyawanRole._id },
    { email: "arif@zafa.com", password, roleId: karyawanRole._id },
    { email: "decky@zafa.com", password, roleId: karyawanRole._id },
    { email: "adi@zafa.com", password, roleId: karyawanRole._id },
    { email: "nico@zafa.com", password, roleId: karyawanRole._id },
    { email: "mariani@zafa.com", password, roleId: karyawanRole._id },
  ]);

  console.log("User seeded");
  return users;
};

export default userSeeder;
