import Employee from "../../models/employee/Employee.model.js";
import EmployeeSalary from "../../models/employee/EmployeeSalary.model.js";
import EmployeeCareer from "../../models/employee/EmployeeCareer.js";
import Position from "../../models/basic/Position.model.js";

const employeeSalarySeeder = async () => {
  try {
    console.log("⏳ Memulai perhitungan gaji dinamis berdasarkan master jabatan...");

    const employees = await Employee.find({}).populate({
      path: "careerData",
      populate: {
        path: "positionId",
        model: "Position",
      },
    });

    if (!employees.length) {
      console.log(" Tidak ada employee ditemukan. Seeding gaji dibatalkan.");
      return;
    }

    await EmployeeSalary.deleteMany({});

    const data = employees.map((employee) => {
      const positionName = employee.careerData?.positionId?.name || "Pegawai";

      let determinedSalary = 4000000;

      switch (positionName) {
        case "Komisaris":
          determinedSalary = 20000000; // Rp 20 Juta
          break;
        case "Direktur Utama":
          determinedSalary = 15000000; // Rp 15 Juta
          break;
        case "Wakil Direktur":
          determinedSalary = 12000000; // Rp 12 Juta
          break;
        case "General Manager":
          determinedSalary = 10000000; // Rp 10 Juta
          break;
        case "Manager":
          determinedSalary = 8000000; // Rp 8 Juta
          break;
        case "Pegawai":
          determinedSalary = 4000000; // Rp 4 Juta
          break;
        default:
          determinedSalary = 4000000; // Fallback pengaman
      }

      return {
        employeeId: employee._id,
        basicSalary: determinedSalary,
        effectiveDate: new Date("2026-01-01"),
      };
    });

    await EmployeeSalary.insertMany(data);

    console.log(
      ` SUKSES: Gaji untuk ${data.length} pegawai berhasil disuntikkan sesuai master jabatan Zafa Tour!`
    );
  } catch (error) {
    console.error(" Gagal melakukan seeding gaji dinamis:", error);
  }
};

export default employeeSalarySeeder;
