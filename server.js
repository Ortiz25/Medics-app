import * as dotenv from "dotenv";
dotenv.config();
import express from "express";
import bcrypt from "bcrypt";
import session from "express-session";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import {
  rescheduleAppointment,
  getUserPhoneNumber,
  getDocName,
  createDoctor,
  getLastDoctorId,
  cancelAppointment,
  updateDoctor,
  deregisterDoctor,
  updateGoogleAppointments,
} from "./util/helper.js";
import {
  Doc,
  Admin,
  Appointment,
  Doctor,
  User,
  Teleappointment,
} from "./util/db.js";
import Africastalking from "africastalking";
import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";

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
// Use express-session middleware
app.use(
  session({
    secret: "m0t0m0t0",
    resave: false,
    saveUninitialized: true,
  })
);

//Africa is talking
const credentials = {
  apiKey: process.env.AFRICASTALKING_TOKEN,
  username: "livecrib",
};

const sms = Africastalking(credentials).SMS;

// Secret key for JWT
const secretKey = process.env.JWT_SECRET;

//google callender outh
const REDIRECT_URI = "http://localhost:4000/oauth2callback";
const oAuth2Client = new OAuth2Client(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  REDIRECT_URI
);

/////////////////////////// GET ROUTES ///////////////////

app.get("/auth", (req, res) => {
  res.render("googlesync", { error: null });
});

// google auth
app.get("/authUrl", (req, res) => {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/calendar"],
  });
  res.redirect(authUrl);
});

app.get("/oauth2callback", async (req, res) => {
  const code = req.query.code;
  const jwToken = req.cookies.jwt;
  if (code) {
    try {
      const { tokens } = await oAuth2Client.getToken(code);
      oAuth2Client.setCredentials(tokens);

      await jwt.verify(jwToken, secretKey, async (err, decoded) => {
        if (err) {
          // Clear the JWT cookie
          res.clearCookie("jwt");
          // JWT verification failed
          return res.render("adminlogin", { error: "Session expired!" });
        }

        await Doc.findOneAndUpdate(
          { username: decoded.username },
          { googleToken: JSON.stringify(tokens) }
        );
      });
      res.redirect("/list");
    } catch (error) {
      console.error("Error retrieving access token", error);
      res.status(500).send("Authentication failed ");
    }
  } else {
    res.status(400).send("No code provided");
  }
});

// Endpoint to list events from Google Calendar
app.get("/list", async (req, res) => {
  const jwToken = req.cookies.jwt;

  try {
    await jwt.verify(jwToken, secretKey, async (err, decoded) => {
      if (err) {
        // Clear the JWT cookie
        res.clearCookie("jwt");
        // JWT verification failed
        return res.render("adminlogin", { error: "Session expired!" });
      }

      const doctor = await Doc.findOne({ username: decoded.username });
      const tokens = JSON.parse(doctor.googleToken);
      oAuth2Client.setCredentials(tokens);

      const calendar = google.calendar({ version: "v3", auth: oAuth2Client });
      const response = await calendar.events.list({
        calendarId: "primary",
        timeMin: new Date().toISOString(),
        maxResults: 10,
        singleEvents: true,
        orderBy: "startTime",
      });

      const events = response.data.items;
      if (events.length) {
        events.map(async (event) => {
          const update = await updateGoogleAppointments({
            appointment_info: event.summary,
            google_id: event.id,
            doctor_id: decoded.docId,
            date: event.start?.dateTime.split(" ")[0],
            start_time: event.start?.dateTime.split("T")[1].split("Z")[0],
            end_time: event.end?.dateTime.split("T")[1].split("Z")[0],
          });
        });
        res.redirect("/dashboard");
      } else {
        res.redirect("/dashboard");
      }
      //res.redirect("/dashboard");
    });
  } catch (error) {
    console.error("Error fetching calendar events:", error);
    res.status(500).send("Error fetching calendar events");
  }
});

// Route to render the login page
app.get("/", (req, res) => {
  res.render("login", { error: null });
});

app.get("/admin", async (req, res) => {
  const token = req.cookies.jwt;

  try {
    if (!token) {
      return res.render("adminlogin", { error: "" });
    }
    // Verify JWT
    await jwt.verify(token, secretKey, (err, decoded) => {
      if (err) {
        // Clear the JWT cookie
        res.clearCookie("jwt");
        // JWT verification failed
        return res.render("adminlogin", { error: "Session expired!" });
      }

      res.render("register", { error: "" });
    });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/register", (req, res) => {
  res.render("register", { error: null });
});

app.get("/docIdNum", async (req, res) => {
  try {
    const docId = await getLastDoctorId();
    console.log(docId);
    res.status(200).json({ number: docId });
  } catch (error) {
    console.log(error);
  }
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

app.get("/editdoc", async (req, res) => {
  const token = req.cookies.jwt;

  try {
    // Verify JWT
    await jwt.verify(token, secretKey, (err, decoded) => {
      if (err) {
        // JWT verification failed
        return res.redirect("/logout");
      }
      // JWT verification successful, render dashboard
      res.render("editdoc");
    });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Route to render the dashboard page
app.get("/dashboard", async (req, res) => {
  // Retrieve JWT from cookie
  const token = req.cookies.jwt;

  console.log(token);

  try {
    // Verify JWT
    await jwt.verify(token, secretKey, async (err, decoded) => {
      if (err) {
        // JWT verification failed
        return res.redirect("/logout");
      }

      // Calculate remaining time until expiration
      const currentTime = Math.floor(Date.now() / 1000);
      const remainingTime = decoded.exp - currentTime;
      // If remaining time is less than a certain threshold (e.g., 5 minutes), generate a new token with an updated expiry time
      if (remainingTime < 300) {
        // 300 seconds = 5 minutes
        const newToken = jwt.sign(
          { username: decoded.username, docId: decoded.docId },
          secretKey,
          {
            expiresIn: "1h",
          }
        );
        res.cookie("jwt", newToken);
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

// Route to render the dashboard page
app.get("/tele", async (req, res) => {
  // Retrieve JWT from cookie
  const token = req.cookies.jwt;

  console.log(token);

  try {
    // Verify JWT
    await jwt.verify(token, secretKey, async (err, decoded) => {
      if (err) {
        // JWT verification failed
        return res.redirect("/logout");
      }

      // Calculate remaining time until expiration
      const currentTime = Math.floor(Date.now() / 1000);
      const remainingTime = decoded.exp - currentTime;
      // If remaining time is less than a certain threshold (e.g., 5 minutes), generate a new token with an updated expiry time
      if (remainingTime < 300) {
        // 300 seconds = 5 minutes
        const newToken = jwt.sign(
          { username: decoded.username, docId: decoded.docId },
          secretKey,
          {
            expiresIn: "1h",
          }
        );
        res.cookie("jwt", newToken);
      }

      const appointments = await Teleappointment.findAll({
        where: { doctor_id: decoded.docId },
        include: [
          { model: Doctor, as: "Doctor", attributes: ["name"] },
          { model: User, as: "User", attributes: ["name"] },
        ],
      });

      // JWT verification successful, render dashboard
      res.render("tele", { appointments });
    });
  } catch (error) {
    console.error("Error fetching appointments:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/admindash", async (req, res) => {
  // Retrieve JWT from cookie
  const token = req.cookies.jwt;

  try {
    // Verify JWT
    await jwt.verify(token, secretKey, async (err, decoded) => {
      if (err) {
        // JWT verification failed
        return res.redirect("/logout");
      }

      const doctors = await Doctor.findAll({
        attributes: { exclude: ["createdAt", "updatedAt"] },
      });
      console.log(doctors);

      // JWT verification successful, render dashboard
      res.render("admindash", { doctors });
    });
  } catch (error) {
    console.error("Error fetching Doctors:", error);
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

/////////////////// POST ROUTES /////////////////////////////////////////////

// google-calender auth
app.post("/auth", async (req, res) => {
  const { email } = req.body;
  const token = req.cookies.jwt;

  try {
    // Verify JWT
    await jwt.verify(token, secretKey, async (err, decoded) => {
      if (err) {
        // JWT verification failed
        return res.redirect("/logout");
      }
      await Doc.findOneAndUpdate(
        { username: decoded.username },
        { googleEmail: email }
      );

      res.redirect("/authUrl");
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
    console.log(doctor);

    if (!doctor) {
      return res.render("login", { error: "User does not exist!" });
    }
    // Verify the password
    await bcrypt.compare(password, doctor.password, function (err, result) {
      if (!result) {
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
  const {
    username,
    name,
    field,
    contact,
    location,
    password,
    cpassword,
    docId,
  } = req.body;

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
      return res.render("register", { error: "Username exits!" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new doctor with the hashed password
    await Doc.create({ username, password: hashedPassword, Doctor_id: docId });

    await createDoctor(docId, name, field, contact, location);

    // Redirect to the dashboard page if doctor creation  is successful
    res.redirect("/admindash");
  } catch (error) {
    console.error("Error Registering Doctor:", error);
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

app.post("/editdoc", async (req, res) => {
  const { doc_id, name, contact, location, field } = req.body;
  const token = req.cookies.jwt;
  console.log(doc_id, name, contact, location, token);

  try {
    // Verify JWT
    await jwt.verify(token, secretKey, async (err, decoded) => {
      if (err) {
        // JWT verification failed
        return res.redirect("/logout");
      }
      const date = new Date();

      //update appointments table
      await updateDoctor(doc_id, name, field, contact, location);

      // send text to patient/ user about the reschedule
      const options = {
        to: [contact],
        message: `Your Doctor-Info updated Successfully on  ${date.getFullYear()}-${date.getMonth()}-${date.getDay()} at ${date.getTime()}`,
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
      res.redirect("/admindash");
    });
  } catch (error) {
    console.error("Error fetching appointments:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/admin", async (req, res) => {
  const { username, password } = req.body;

  try {
    // Find the doctor with the provided username
    const admin = await Admin.findOne({ username: username });
    if (!admin) {
      return res.render("adminlogin", { error: "Admin User does not exist!" });
    }

    // Verify the password
    await bcrypt.compare(
      password,
      admin.password,
      async function (err, result) {
        if (!result) {
          return res.render("adminlogin", { error: "Incorrect password" });
        }
        const docId = await getLastDoctorId();

        // If credentials are valid, generate JWT token
        const token = jwt.sign({ username: admin.username }, secretKey, {
          expiresIn: "1h",
        });

        res.cookie("jwt", token);
        res.cookie("docid", docId);

        // Set the JWT as a cookie
        res.render("register", { error: "" });
      }
    );
  } catch (error) {
    console.error("Error fetching appointments:", error);
    res.status(500).send("Internal Server Error");
  }
});
app.post("/cancelAppointment", async (req, res) => {
  const { appointmentId, userId } = req.body;
  const token = req.cookies.jwt;
  try {
    // Verify JWT
    await jwt.verify(token, secretKey, async (err, decoded) => {
      if (err) {
        // JWT verification failed
        return res.redirect("/logout");
      }
      //update appointments table
      await cancelAppointment(appointmentId);

      // send text to patient/ user about the  cancelation
      const userPhone = await getUserPhoneNumber(userId);
      const docName = await getDocName(decoded.docId);
      const options = {
        to: [userPhone],
        message: `Appointment Canceled with ${docName}`,
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

      res.status(200).json({ message: "appointment canceled" });
    });
  } catch (error) {
    console.log(error);
  }
});

app.post("/deregesterDoc", async (req, res) => {
  const { doctorId } = req.body;
  const token = req.cookies.jwt;
  try {
    // Verify JWT
    await jwt.verify(token, secretKey, async (err, decoded) => {
      if (err) {
        // JWT verification failed
        return res.redirect("/logout");
      }
      //update appointments table
      await Doc.findOneAndDelete({
        Doctor_id: doctorId,
      });
      await deregisterDoctor(doctorId);

      res.status(200).json({ message: "Doctor Deregistered" });
    });
  } catch (error) {
    console.log(error);
  }
});

// Start the server
const PORT = 4000;
const HOST = "0.0.0.0";
app.listen(PORT, HOST, () => {
  console.log(`Server is running on port ${PORT}`);
});
