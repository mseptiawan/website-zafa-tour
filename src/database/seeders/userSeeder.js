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
    { username: "rafikafitrianti", password, roleId: pimpinanRole._id },

    // ================= HR =================
    { username: "duwihartati", password, roleId: hrRole._id },

    // ================= MANAGER =================
    { username: "ronaldrizky", password, roleId: managerRole._id },
    { username: "meltisundari", password, roleId: managerRole._id },
    // ================= KEUANGAN =================
    { username: "fadhilah", password, roleId: keuanganRole._id },

    // ================= EMPLOYEE =================
    { username: "gustidiansyah", password, roleId: karyawanRole._id },
    { username: "willycauza", password, roleId: karyawanRole._id },

    { username: "mriskywindinata", password, roleId: karyawanRole._id },
    { username: "lilymustikasari", password, roleId: karyawanRole._id },
    { username: "febriansyah", password, roleId: karyawanRole._id },
    { username: "adindarismayani", password, roleId: karyawanRole._id },
    { username: "fajarjaniko", password, roleId: karyawanRole._id },
    { username: "rendijalil", password, roleId: karyawanRole._id },
    { username: "abdulaziz", password, roleId: karyawanRole._id },
    { username: "basoherman", password, roleId: karyawanRole._id },
    { username: "ongkidwi", password, roleId: karyawanRole._id },
    { username: "sarwanto", password, roleId: karyawanRole._id },
    { username: "dirasuhada", password, roleId: karyawanRole._id },
    { username: "muliaeka", password, roleId: karyawanRole._id },
    { username: "dinaanggraini", password, roleId: karyawanRole._id },
    { username: "nurul", password, roleId: karyawanRole._id },
    { username: "arifsuprastiyo", password, roleId: karyawanRole._id },
    { username: "deckycaprianus", password, roleId: karyawanRole._id },
    { username: "adikurniadi", password, roleId: karyawanRole._id },
    { username: "nicoyudhira", password, roleId: karyawanRole._id },
    { username: "mariani", password, roleId: karyawanRole._id },
    { username: "adipuja", password, roleId: karyawanRole._id },

  ]);

  console.log("User seeded");
  return users;
};

export default userSeeder;
