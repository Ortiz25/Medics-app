import { Appointment, User, Doctor } from "../server.js";

export async function rescheduleAppointment(
  userId,
  appointmentId,
  newDate,
  newTime
) {
  try {
    const appointment = await Appointment.findOne({
      where: {
        user_id: userId,
        appointment_id: appointmentId,
      },
    });

    if (!appointment) {
      throw new Error("Appointment not found");
    }

    // Update the appointment attributes
    appointment.date = newDate;
    appointment.time = newTime;
    appointment.status = "rescheduled";

    // Save the changes to the database
    await appointment.save();

    console.log("Appointment rescheduled successfully");
  } catch (error) {
    console.error("Error rescheduling appointment:", error);
  }
}

export async function getUserPhoneNumber(userId) {
  try {
    const user = await User.findOne({
      attributes: ["phone_number"],
      where: {
        user_id: userId,
      },
    });
    if (user) {
      return user.dataValues.phone_number;
    } else {
      return null; // User not found
    }
  } catch (error) {
    console.error("Error fetching user's phone number:", error);
    throw error;
  }
}

export async function getDocName(docId) {
  try {
    const doctor = await Doctor.findOne({
      attributes: ["name"],
      where: {
        doctor_id: docId,
      },
    });
    if (doctor) {
      return doctor.dataValues.name;
    } else {
      return null; // User not found
    }
  } catch (error) {
    console.error("Error fetching user's phone number:", error);
    throw error;
  }
}

export async function createDoctor(docId, name, field, contact, location) {
  try {
    const newDoctor = await Doctor.create({
      doctor_id: docId,
      name: name,
      type: field,
      contact_info: contact,
      location: location,
    });
    return newDoctor;
  } catch (error) {
    console.error("Error creating doctor:", error);
    throw error;
  }
}
