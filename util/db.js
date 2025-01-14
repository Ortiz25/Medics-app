import * as dotenv from "dotenv";
dotenv.config();
import { Sequelize, DataTypes } from "sequelize";
import mongoose from "mongoose";

<<<<<<< HEAD
// mongodb Database connection code
=======
// mongodb Database connection
>>>>>>> main
main().catch((err) => console.log(err));
async function main() {
  await mongoose.connect(
    "mongodb+srv://samueldeya:m0t0m0t0@cluster0.qd7gjoz.mongodb.net/docs-medicare-app?retryWrites=true&w=majority",
    {}
  );
}

const docSchema = new mongoose.Schema({
  Doctor_id: String,
  username: String,
  password: String,
  googleToken: String,
  googleEmail: String,
});
export const Doc = mongoose.model("Doc", docSchema);

const adminSchema = new mongoose.Schema({
  username: String,
  password: String,
});

export const Admin = mongoose.model("Admin", adminSchema);

// mysql Database connection
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
<<<<<<< HEAD
    host: process.env.DB_HOST,
    dialect: 'postgres',
    port: process.env.PORT,
  }
);
// Define models
export const user = sequelize.define(
  "user",
  {
    user_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: DataTypes.STRING,
    age: DataTypes.STRING,
    phone_number: DataTypes.STRING,
    location: DataTypes.STRING,
  },
  {
    timestamps: false,
  }
);

export const doctor = sequelize.define(
  "doctor",
=======
    host: process.env.MYSQLDB_HOST,
    dialect: "mysql",
    port: process.env.PORT,
  }
);

// Define models
export const User = sequelize.define("User", {
  user_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: DataTypes.STRING,
});

export const Doctor = sequelize.define(
  "Doctor",
>>>>>>> main
  {
    doctor_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: DataTypes.STRING,
    contact_info: {
      type: DataTypes.STRING,
      unique: true,
    },
    type: DataTypes.STRING,
    location: DataTypes.STRING,
<<<<<<< HEAD
    email: DataTypes.STRING,
    address: DataTypes.STRING,
=======
>>>>>>> main
  },
  {
    timestamps: false,
  }
);

<<<<<<< HEAD
export const appointment = sequelize.define(
  "appointment",
  {
    appointment_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: DataTypes.INTEGER,
    doctor_id: DataTypes.INTEGER,
    date: DataTypes.DATE,
    time: DataTypes.STRING,
    status: DataTypes.STRING,
  },
  {
    timestamps: false,
  }
);
export const teleappointment = sequelize.define(
  "teleappointment",
=======
export const Appointment = sequelize.define(
  "Appointment",
>>>>>>> main
  {
    appointment_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: DataTypes.INTEGER,
    doctor_id: DataTypes.INTEGER,
    date: DataTypes.DATE,
    time: DataTypes.STRING,
    status: DataTypes.STRING,
  },
  {
    timestamps: false,
  }
);

<<<<<<< HEAD
export const googleappointment = sequelize.define(
  "googleappointment",
=======
export const Teleappointment = sequelize.define(
  "Teleappointment",
  {
    appointment_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: DataTypes.INTEGER,
    doctor_id: DataTypes.INTEGER,
    date: DataTypes.DATE,
    time: DataTypes.STRING,
    status: DataTypes.STRING,
  },
  {
    timestamps: false,
  }
);

export const Googleappointment = sequelize.define(
  "Googleappointment",
>>>>>>> main
  {
    appointment_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    doctor_id: DataTypes.INTEGER,
<<<<<<< HEAD
    date: DataTypes.DATEONLY,
=======
    date: DataTypes.DATE,
>>>>>>> main
    start_time: DataTypes.TIME,
    end_time: DataTypes.TIME,
    appointment_info: DataTypes.STRING,
    google_id: DataTypes.STRING,
  },
  {
    timestamps: false,
  }
);

// Define associations
<<<<<<< HEAD
appointment.belongsTo(user, { foreignKey: "user_id", as: "User" });
appointment.belongsTo(doctor, { foreignKey: "doctor_id", as: "Doctor" });
teleappointment.belongsTo(user, { foreignKey: "user_id", as: "User" });
teleappointment.belongsTo(doctor, { foreignKey: "doctor_id", as: "Doctor" });
user.hasMany(appointment, { foreignKey: "user_id" });
doctor.hasMany(appointment, { foreignKey: "doctor_id" });
=======
Appointment.belongsTo(User, { foreignKey: "user_id", as: "User" });
Appointment.belongsTo(Doctor, { foreignKey: "doctor_id", as: "Doctor" });
Teleappointment.belongsTo(User, { foreignKey: "user_id", as: "User" });
Teleappointment.belongsTo(Doctor, { foreignKey: "doctor_id", as: "Doctor" });
User.hasMany(Appointment, { foreignKey: "user_id" });
Doctor.hasMany(Appointment, { foreignKey: "doctor_id" });
>>>>>>> main
