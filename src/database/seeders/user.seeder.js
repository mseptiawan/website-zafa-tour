import bcrypt from "bcrypt";
import User from "../../models/basic/User.model.js";
import Role from "../../models/basic/Role.model.js";

const userSeeder = async () => {
  await User.deleteMany();

  const password = await bcrypt.hash("zafasecret", 10);

  const wadirRole = await Role.findOne({ name: "WAKIL_DIREKTUR" });
  const managerAdminRole = await Role.findOne({ name: "MANAGER_ADMINISTRASI" });
  const direkturUtamaRole = await Role.findOne({ name: "DIREKTUR_UTAMA" });
  const pegawaiRole = await Role.findOne({ name: "PEGAWAI" });
  const managerKeuanganRole = await Role.findOne({ name: "MANAGER_KEUANGAN" });
  const managerHajiUmrahRole = await Role.findOne({
    name: "MANAGER_HAJI_UMRAH",
  });
  const users = await User.insertMany([
    {
      username: "rafikafitrianti",
      email: "rafikafitrianti@gmail.com",
      password,
      roleId: direkturUtamaRole._id,
    },
    {
      username: "duwihartati",
      email: "mseptiawan017@gmail.com",
      password,
      roleId: wadirRole._id,
    },
    {
      username: "ronaldrizky",
      email: "ronaldrizky@gmail.com",
      password,
      roleId: pegawaiRole._id,
    },
    {
      username: "meltisundari",
      email: "meltisundari@gmail.com",
      password,
      roleId: managerAdminRole._id,
    },
    {
      username: "fadhilah",
      email: "fadhilah@gmail.com",
      password,
      roleId: managerKeuanganRole._id,
    },
    {
      username: "gustidiansyah",
      email: "gustidiansyah@gmail.com",
      password,
      roleId: pegawaiRole._id,
    },
    {
      username: "willycauza",
      email: "willycauza@gmail.com",
      password,
      roleId: pegawaiRole._id,
    },
    {
      username: "mriskywindinata",
      email: "mriskywindinata@gmail.com",
      password,
      roleId: pegawaiRole._id,
    },
    {
      username: "lilymustikasari",
      email: "lilymustikasari@gmail.com",
      password,
      roleId: pegawaiRole._id,
    },
    {
      username: "febriansyah",
      email: "febriansyah@gmail.com",
      password,
      roleId: pegawaiRole._id,
    },
    {
      username: "adindarismayani",
      email: "adindarismayani@gmail.com",
      password,
      roleId: pegawaiRole._id,
    },
    {
      username: "fajarjaniko",
      email: "fajarjaniko@gmail.com",
      password,
      roleId: pegawaiRole._id,
    },
    {
      username: "rendijalil",
      email: "rendijalil@gmail.com",
      password,
      roleId: pegawaiRole._id,
    },
    {
      username: "abdulaziz",
      email: "abdulaziz@gmail.com",
      password,
      roleId: pegawaiRole._id,
    },
    {
      username: "basoherman",
      email: "basoherman@gmail.com",
      password,
      roleId: managerHajiUmrahRole._id,
    },
    {
      username: "ongkidwi",
      email: "ongkidwi@gmail.com",
      password,
      roleId: pegawaiRole._id,
    },
    {
      username: "sarwanto",
      email: "sarwanto@gmail.com",
      password,
      roleId: pegawaiRole._id,
    },
    {
      username: "dirasuhada",
      email: "dirasuhada@gmail.com",
      password,
      roleId: pegawaiRole._id,
    },
    {
      username: "muliaeka",
      email: "muliaeka@gmail.com",
      password,
      roleId: pegawaiRole._id,
    },
    {
      username: "dinaanggraini",
      email: "dinaanggraini@gmail.com",
      password,
      roleId: pegawaiRole._id,
    },
    {
      username: "nurul",
      email: "nurul@gmail.com",
      password,
      roleId: pegawaiRole._id,
    },
    {
      username: "arifsuprastiyo",
      email: "arifsuprastiyo@gmail.com",
      password,
      roleId: pegawaiRole._id,
    },
    {
      username: "deckycaprianus",
      email: "deckycaprianus@gmail.com",
      password,
      roleId: pegawaiRole._id,
    },
    {
      username: "adikurniadi",
      email: "adikurniadi@gmail.com",
      password,
      roleId: pegawaiRole._id,
    },
    {
      username: "nicoyudhira",
      email: "nicoyudhira@gmail.com",
      password,
      roleId: pegawaiRole._id,
    },
    {
      username: "mariani",
      email: "mariani@gmail.com",
      password,
      roleId: pegawaiRole._id,
    },
    {
      username: "adipuja",
      email: "adipuja@gmail.com",
      password,
      roleId: pegawaiRole._id,
    },
  ]);

  return users;
};

export default userSeeder;
