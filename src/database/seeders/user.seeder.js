import bcrypt from "bcrypt";
import User from "../../models/User.js";
import Role from "../../models/Role.js";

const userSeeder = async () => {
  await User.deleteMany();

  const password = await bcrypt.hash("zafasecret", 10);

  const hrRole = await Role.findOne({ name: "HR" });
  const managerRole = await Role.findOne({ name: "MANAGER" });
  const generalManagerRole = await Role.findOne({ name: "GENERAL_MANAGER" });
  const komisarisRole = await Role.findOne({ name: "KOMISARIS" });

  const pimpinanRole = await Role.findOne({ name: "PIMPINAN" });
  const staffRole = await Role.findOne({ name: "STAFF" });
  const keuanganRole = await Role.findOne({ name: "KEUANGAN" });

  const users = await User.insertMany([
    // ================= PIMPINAN =================
    {
      username: "rafikafitrianti",
      email: "rafikafitrianti@gmail.com",
      password,
      roleId: pimpinanRole._id,
    },

    // ================= HR =================
    {
      username: "duwihartati",
      email: "mseptiawan017@gmail.com",
      password,
      roleId: hrRole._id,
    },

    // ================= MANAGER =================
    {
      username: "ronaldrizky",
      email: "ronaldrizky@gmail.com",
      password,
      roleId: generalManagerRole._id,
    },
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
      roleId: komisarisRole._id,
    },
    {
      username: "willycauza",
      email: "willycauza@gmail.com",
      password,
      roleId: generalManagerRole._id,
    },

    {
      username: "mriskywindinata",
      email: "mriskywindinata@gmail.com",
      password,
      roleId: staffRole._id,
    },
    {
      username: "lilymustikasari",
      email: "lilymustikasari@gmail.com",
      password,
      roleId: staffRole._id,
    },
    { username: "febriansyah", email: "febriansyah@gmail.com", password, roleId: staffRole._id },
    {
      username: "adindarismayani",
      email: "adindarismayani@gmail.com",
      password,
      roleId: staffRole._id,
    },
    { username: "fajarjaniko", email: "fajarjaniko@gmail.com", password, roleId: staffRole._id },
    { username: "rendijalil", email: "rendijalil@gmail.com", password, roleId: staffRole._id },
    { username: "abdulaziz", email: "abdulaziz@gmail.com", password, roleId: staffRole._id },
    { username: "basoherman", email: "basoherman@gmail.com", password, roleId: staffRole._id },
    { username: "ongkidwi", email: "ongkidwi@gmail.com", password, roleId: staffRole._id },
    { username: "sarwanto", email: "sarwanto@gmail.com", password, roleId: staffRole._id },
    { username: "dirasuhada", email: "dirasuhada@gmail.com", password, roleId: staffRole._id },
    { username: "muliaeka", email: "muliaeka@gmail.com", password, roleId: staffRole._id },
    {
      username: "dinaanggraini",
      email: "dinaanggraini@gmail.com",
      password,
      roleId: staffRole._id,
    },
    { username: "nurul", email: "nurul@gmail.com", password, roleId: staffRole._id },
    {
      username: "arifsuprastiyo",
      email: "arifsuprastiyo@gmail.com",
      password,
      roleId: staffRole._id,
    },
    {
      username: "deckycaprianus",
      email: "deckycaprianus@gmail.com",
      password,
      roleId: staffRole._id,
    },
    { username: "adikurniadi", email: "adikurniadi@gmail.com", password, roleId: staffRole._id },
    { username: "nicoyudhira", email: "nicoyudhira@gmail.com", password, roleId: staffRole._id },
    { username: "mariani", email: "mariani@gmail.com", password, roleId: staffRole._id },
    { username: "adipuja", email: "adipuja@gmail.com", password, roleId: staffRole._id },
  ]);

  console.log("User seeded");
  return users;
};

export default userSeeder;
