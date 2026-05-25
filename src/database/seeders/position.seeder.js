import Position from "../../models/basic/Position.js";

const positionSeeder = async () => {
  await Position.deleteMany();

  await Position.insertMany([
    {
      name: "Komisaris",
    },

    {
      name: "Direktur Utama",
    },

    {
      name: "Wakil Direktur",
    },

    {
      name: "General Manager",
    },

    {
      name: "Manager",
    },

    {
      name: "Pegawai",
    },
  ]);

  console.log("Positions seeded");
};

export default positionSeeder;
