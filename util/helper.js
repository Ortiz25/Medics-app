import { Appointment, User, Doctor } from "../server.js";

export async function deregisterDoctor(id) {
  try {
    await Appointment.destroy({
      where: {
        doctor_id: id,
      },
    });
    console.log("Appointment deleted successfully.");
    await Doctor.destroy({
      where: {
        doctor_id: id,
      },
    });

    console.log("Doctor derigestered");
  } catch (error) {
    console.log(error);
  }
}

export async function updateDoctor(id, name, field, contact, location) {
  try {
    await Doctor.update(
      {
        name: name,
        type: field,
        contact_info: contact,
        location: location,
      },
      {
        where: {
          doctor_id: id,
        },
      }
    );
  } catch (error) {
    console.log(error);
  }
}

export async function cancelAppointment(id) {
  try {
    await Appointment.destroy({
      where: {
        appointment_id: id,
      },
    });
    console.log("Appointment deleted successfully.");
  } catch (error) {
    console.log(error);
  }
}

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

export async function getLastDoctorId() {
  try {
    const lastDoctor = await Doctor.findOne({
      attributes: ["doctor_id"],
      order: [["doctor_id", "DESC"]],
    });
    if (lastDoctor) {
      return lastDoctor.doctor_id;
    } else {
      return null; // No doctors found
    }
  } catch (error) {
    console.error("Error fetching last doctor ID:", error);
    throw error;
  }
}
