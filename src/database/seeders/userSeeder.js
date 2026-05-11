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
    {
      username: "rafikafitrianti",
      email: "rafikafitrianti@gmail.com",
      password,
      roleId: pimpinanRole._id,
    },

    // ================= HR =================
    { username: "duwihartati", email: "mseptiawan017@gmail.com", password, roleId: hrRole._id },

    // ================= MANAGER =================
    { username: "ronaldrizky", email: "ronaldrizky@gmail.com", password, roleId: managerRole._id },
    {
      username: "meltisundari",
      email: "meltisundari@gmail.com",
      password,
      roleId: managerRole._id,
    },

    // ================= KEUANGAN =================
    { username: "fadhilah", email: "fadhilah@gmail.com", password, roleId: keuanganRole._id },

    // ================= EMPLOYEE =================
    {
      username: "gustidiansyah",
      email: "gustidiansyah@gmail.com",
      password,
      roleId: pimpinanRole._id,
    },
    { username: "willycauza", email: "willycauza@gmail.com", password, roleId: karyawanRole._id },

    {
      username: "mriskywindinata",
      email: "mriskywindinata@gmail.com",
      password,
      roleId: karyawanRole._id,
    },
    {
      username: "lilymustikasari",
      email: "lilymustikasari@gmail.com",
      password,
      roleId: karyawanRole._id,
    },
    { username: "febriansyah", email: "febriansyah@gmail.com", password, roleId: karyawanRole._id },
    {
      username: "adindarismayani",
      email: "adindarismayani@gmail.com",
      password,
      roleId: karyawanRole._id,
    },
    { username: "fajarjaniko", email: "fajarjaniko@gmail.com", password, roleId: karyawanRole._id },
    { username: "rendijalil", email: "rendijalil@gmail.com", password, roleId: karyawanRole._id },
    { username: "abdulaziz", email: "abdulaziz@gmail.com", password, roleId: karyawanRole._id },
    { username: "basoherman", email: "basoherman@gmail.com", password, roleId: karyawanRole._id },
    { username: "ongkidwi", email: "ongkidwi@gmail.com", password, roleId: karyawanRole._id },
    { username: "sarwanto", email: "sarwanto@gmail.com", password, roleId: karyawanRole._id },
    { username: "dirasuhada", email: "dirasuhada@gmail.com", password, roleId: karyawanRole._id },
    { username: "muliaeka", email: "muliaeka@gmail.com", password, roleId: karyawanRole._id },
    {
      username: "dinaanggraini",
      email: "dinaanggraini@gmail.com",
      password,
      roleId: karyawanRole._id,
    },
    { username: "nurul", email: "nurul@gmail.com", password, roleId: karyawanRole._id },
    {
      username: "arifsuprastiyo",
      email: "arifsuprastiyo@gmail.com",
      password,
      roleId: karyawanRole._id,
    },
    {
      username: "deckycaprianus",
      email: "deckycaprianus@gmail.com",
      password,
      roleId: karyawanRole._id,
    },
    { username: "adikurniadi", email: "adikurniadi@gmail.com", password, roleId: karyawanRole._id },
    { username: "nicoyudhira", email: "nicoyudhira@gmail.com", password, roleId: karyawanRole._id },
    { username: "mariani", email: "mariani@gmail.com", password, roleId: karyawanRole._id },
    { username: "adipuja", email: "adipuja@gmail.com", password, roleId: karyawanRole._id },
  ]);

  console.log("User seeded");
  return users;
};

export default userSeeder;
