const appointmentBookedTemplate = ({
  userName,
  doctorName,
  hospitalName,
  date,
  timeSlot,
  status,
}) => {
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f7fb;">
      <div style="max-width: 640px; margin: auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb;">
        <div style="background-color: #0f766e; padding: 24px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 26px;">
            Appointment Booked
          </h1>
          <p style="color: #ccfbf1; margin: 8px 0 0;">
            Your request has been received successfully.
          </p>
        </div>

        <div style="padding: 30px;">
          <h2 style="margin: 0 0 12px; color: #0f172a;">Hello ${userName},</h2>

          <p style="margin: 0 0 20px; color: #475569; line-height: 1.6;">
            Thank you for booking an appointment through MediCore. Your appointment is currently marked as
            <strong>${status}</strong>. The hospital team can confirm it from their system.
          </p>

          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px;">
            <p style="margin: 0 0 10px;"><strong>Doctor:</strong> ${doctorName}</p>
            <p style="margin: 0 0 10px;"><strong>Hospital:</strong> ${hospitalName}</p>
            <p style="margin: 0 0 10px;"><strong>Date:</strong> ${date}</p>
            <p style="margin: 0;"><strong>Time Slot:</strong> ${timeSlot}</p>
          </div>

          <p style="margin: 22px 0 0; color: #475569; line-height: 1.6;">
            Please arrive a little early and carry any previous medical reports if available.
          </p>

          <p style="margin: 30px 0 0; color: #0f172a;">
            Regards,<br/>
            Hospital Management Team
          </p>
        </div>
      </div>
    </div>
  `;
};

module.exports = appointmentBookedTemplate;
