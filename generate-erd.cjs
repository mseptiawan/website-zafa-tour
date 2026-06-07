const mongooseErdGenerator = require("mongoose-erd-generator");
const path = require("path");

mongooseErdGenerator({
  modelsPath: path.resolve(__dirname, "./src/models"),
  targetPath: path.resolve(__dirname, "./erd.svg"),
})
  .then(() => console.log("ERD Berhasil dibuat dalam format erd.svg!"))
  .catch((err) => console.error("Gagal membuat ERD:", err));
