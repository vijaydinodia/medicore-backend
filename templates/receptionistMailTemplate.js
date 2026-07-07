const receptionistMailTemplate = ({ receptionistName, email, password, receptionistCode, hospitalName }) => {
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4;">
      <div style="max-width: 600px; margin: auto; background: white; border-radius: 10px; overflow: hidden;">
        <div style="background-color: #10b981; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Receptionist Account Created</h1>
        </div>

        <div style="padding: 30px;">
          <h2>Hello ${receptionistName},</h2>

          <p>Your receptionist account has been created successfully for <strong>${hospitalName}</strong>.</p>

          <div style="background: #f9fafb; padding: 20px; border-radius: 8px;">
            <p><strong>Name:</strong> ${receptionistName}</p>
            <p><strong>Staff Code:</strong> ${receptionistCode}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Password:</strong> ${password}</p>
          </div>

          <p style="margin-top: 20px;">
            Please keep your credentials secure and change your password after first login.
          </p>

          <div style="margin-top: 30px; text-align: center;">
            <a
              href="http://localhost:5173/login"
              style="
                background-color: #10b981;
                color: white;
                padding: 12px 25px;
                text-decoration: none;
                border-radius: 5px;
                display: inline-block;
              "
            >
              Login Now
            </a>
          </div>

          <p style="margin-top: 30px;">
            Regards,<br/>
            Hospital Management Team
          </p>
        </div>
      </div>
    </div>
  `;
};

module.exports = receptionistMailTemplate;
