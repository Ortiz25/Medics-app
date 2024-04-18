import * as dotenv from "dotenv";
dotenv.config();
import express from "express";
import { Sequelize, DataTypes } from "sequelize";
import bcrypt from "bcrypt";
import session from "express-session";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import {
  rescheduleAppointment,
  getUserPhoneNumber,
  getDocName,
} from "./util/helper.js";
import Africastalking from "africastalking";

// Initialize express app
const app = express();
// View engine setup
app.set("views", "./views");
app.set("view engine", "ejs");
app.use(express.static("./public"));

// Middleware to parse JSON and urlencoded request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Africa is talking
const credentials = {
  apiKey: process.env.AFRICASTALKING_TOKEN,
  username: "livecrib",
};

const sms = Africastalking(credentials).SMS;

// mysql Database connection
const sequelize = new Sequelize("medicare", "node", "m0t0m0t0", {
  host: process.env.MYSQLDB_HOST,
  dialect: "mysql",
  port: process.env.PORT,
});

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
});
const Doc = mongoose.model("Doc", docSchema);

// Define models
export const User = sequelize.define("User", {
  user_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: DataTypes.STRING,
});

export const Doctor = sequelize.define("Doctor", {
  doctor_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: DataTypes.STRING,
  username: {
    type: DataTypes.STRING,
    unique: true,
  },
  password: DataTypes.STRING,
});

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
    time: DataTypes.TIME,
    status: DataTypes.STRING,
  },
  {
    timestamps: false, // Disable timestamps for Appointment model
  }
);

// Define associations
Appointment.belongsTo(User, { foreignKey: "user_id", as: "User" });
Appointment.belongsTo(Doctor, { foreignKey: "doctor_id", as: "Doctor" });
User.hasMany(Appointment, { foreignKey: "user_id" });
Doctor.hasMany(Appointment, { foreignKey: "doctor_id" });

// Secret key for JWT
const secretKey = process.env.JWT_SECRET;

// Use express-session middleware
app.use(
  session({
    secret: "m0t0m0t0",
    resave: false,
    saveUninitialized: true,
  })
);

// Route to render the login page
app.get("/", (req, res) => {
  res.render("login", { error: null });
});

app.get("/register", (req, res) => {
  res.render("register", { error: null });
});

app.get("/logout", async (req, res) => {
  const token = req.cookies.jwt;

  try {
    // Verify JWT
    await jwt.verify(token, secretKey, (err, decoded) => {
      if (err) {
        // Clear the JWT cookie
        res.clearCookie("jwt");
        // JWT verification failed
        return res.render("login", { error: "Session expired!" });
      }
      // Clear the JWT cookie
      res.clearCookie("jwt");
      return res.render("login", { error: "" });
    });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/editapp", async (req, res) => {
  const token = req.cookies.jwt;

  try {
    // Verify JWT
    await jwt.verify(token, secretKey, (err, decoded) => {
      if (err) {
        // JWT verification failed
        return res.redirect("/logout");
      }
      // JWT verification successful, render dashboard
      res.render("editapp");
    });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Route to handle login form submission
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    // Find the doctor with the provided username
    const doctor = await Doc.findOne({ username: username });
    if (!doctor) {
      return res.render("register", { error: "User does not exist!" });
    }
    // Verify the password
    await bcrypt.compare(password, doctor.password, function (err, result) {
      if (!result) {
        console.log("result", result);
        return res.render("login", { error: "Invalid username or password" });
      }

      // If credentials are valid, generate JWT token
      const token = jwt.sign(
        { username: doctor.username, docId: doctor.Doctor_id },
        secretKey,
        {
          expiresIn: "1h",
        }
      );

      res.cookie("jwt", token);

      // Set the JWT as a cookie
      res.redirect("/dashboard");
    });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Route to handle registration form submission
app.post("/register", async (req, res) => {
  const { username, password, cpassword, doc_id } = req.body;

  try {
    if (password !== cpassword) {
      return res.render("register", { error: "Passwords do not match" });
    }
    if (password.length < 6) {
      return res.render("register", {
        error: "Password should be atleast 6 characters long!",
      });
    }

    // Find the doctor with the provided username
    const doctor = await Doc.findOne({ username: username });
    if (doctor) {
      return res.render("register", { error: "User exits! Go to login!" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new doctor with the hashed password
    await Doc.create({ username, password: hashedPassword, Doctor_id: doc_id });

    // Redirect to the dashboard page if authentication is successful
    res.render("login", { error: "" });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Route to render the dashboard page
app.get("/dashboard", async (req, res) => {
  // Retrieve JWT from cookie
  const token = req.cookies.jwt;

  try {
    // Verify JWT
    await jwt.verify(token, secretKey, async (err, decoded) => {
      if (err) {
        // JWT verification failed
        return res.redirect("/logout");
      }

      const appointments = await Appointment.findAll({
        where: { doctor_id: decoded.docId },
        include: [
          { model: Doctor, as: "Doctor", attributes: ["name"] },
          { model: User, as: "User", attributes: ["name"] },
        ],
      });

      // JWT verification successful, render dashboard
      res.render("index", { appointments });
    });
  } catch (error) {
    console.error("Error fetching appointments:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/filter", async (req, res) => {
  // Retrieve JWT from cookie
  const token = req.cookies.jwt;
  const data = req.session.data;

  try {
    const appointments = await Appointment.findAll({
      include: [
        { model: Doctor, as: "Doctor", attributes: ["name"] },
        { model: User, as: "User", attributes: ["name"] },
      ],
    });

    // Verify JWT
    await jwt.verify(token, secretKey, (err, decoded) => {
      if (err) {
        // JWT verification failed
        return res.redirect("/logout");
      }
      // JWT verification successful, render dashboard
      res.render("allapp", { appointments });
    });
  } catch (error) {
    console.error("Error fetching appointments:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/edit", async (req, res) => {
  const { app_id, user, date, time } = req.body;
  const token = req.cookies.jwt;

  try {
    // Verify JWT
    await jwt.verify(token, secretKey, async (err, decoded) => {
      if (err) {
        // JWT verification failed
        return res.redirect("/logout");
      }

      //update appointments table
      await rescheduleAppointment(user, app_id, date, time);

      // send text to patient/ user about the reschedule
      const userPhone = await getUserPhoneNumber(user);
      const docName = await getDocName(decoded.docId);
      const options = {
        to: [userPhone],
        message: `Appointment Rescheduled with ${docName} to ${date} at ${time}`,
      };
      async function sendSMS() {
        try {
          const result = await sms.send(options);
          console.log(result);
        } catch (err) {
          console.error(err);
        }
      }
      sendSMS();

      // JWT verification successful, render dashboard
      res.redirect("/dashboard");
    });
  } catch (error) {
    console.error("Error fetching appointments:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Start the server
const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
