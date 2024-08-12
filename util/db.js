import * as dotenv from "dotenv";
dotenv.config();
import { Sequelize, DataTypes } from "sequelize";
import mongoose from "mongoose";

// mongodb Database connection
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
  },
  {
    timestamps: false,
  }
);

export const Appointment = sequelize.define(
  "Appointment",
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
  {
    appointment_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    doctor_id: DataTypes.INTEGER,
    date: DataTypes.DATE,
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
Appointment.belongsTo(User, { foreignKey: "user_id", as: "User" });
Appointment.belongsTo(Doctor, { foreignKey: "doctor_id", as: "Doctor" });
Teleappointment.belongsTo(User, { foreignKey: "user_id", as: "User" });
Teleappointment.belongsTo(Doctor, { foreignKey: "doctor_id", as: "Doctor" });
User.hasMany(Appointment, { foreignKey: "user_id" });
Doctor.hasMany(Appointment, { foreignKey: "doctor_id" });
