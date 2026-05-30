import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema(
  {
    employeeIdNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    fullName: {
      type: String,
      required: true,
    },

    nomor_ktp: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    tempat_lahir: {
      type: String,
      required: false,
    },
    tanggal_lahir: {
      type: Date,
      required: false,
    },
    jenis_kelamin: {
      type: String,
      enum: ["Laki-Laki", "Perempuan"],
      required: true,
    },
    agama: {
      type: String,
      required: true,
    },
    golongan_darah: {
      type: String,
      trim: true,
    },
    status_pernikahan: {
      type: String,
      enum: ["Lajang", "Menikah", "Cerai"],
      required: false,
    },
    foto_profile: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);
employeeSchema.virtual("terminationHistory", {
  ref: "Termination",
  localField: "_id",
  foreignField: "employeeId",
  justOne: false,
});

employeeSchema.virtual("salaryDetail", {
  ref: "EmployeeSalary",
  localField: "_id",
  foreignField: "employeeId",
  justOne: true,
});

employeeSchema.virtual("careerData", {
  ref: "EmployeeCareer",
  localField: "_id",
  foreignField: "employee_id",
  justOne: true,
});

employeeSchema.virtual("contactData", {
  ref: "EmployeeContact",
  localField: "_id",
  foreignField: "employee_id",
  justOne: true,
});

employeeSchema.virtual("educationData", {
  ref: "EmployeeEducation",
  localField: "_id",
  foreignField: "employee_id",
  justOne: true,
});

employeeSchema.virtual("financialData", {
  ref: "EmployeeFinancial",
  localField: "_id",
  foreignField: "employee_id",
  justOne: true,
});

employeeSchema.virtual("documentData", {
  ref: "EmployeeDocument",
  localField: "_id",
  foreignField: "employee_id",
  justOne: true,
});

employeeSchema.set("toObject", { virtuals: true });
employeeSchema.set("toJSON", { virtuals: true });

const Employee = mongoose.model("Employee", employeeSchema);

export default Employee;
