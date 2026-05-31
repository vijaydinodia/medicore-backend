const medicalMailTemplate = ({
  medicalName,
  medicalCode,
  email,
  password,
  hospitalName,
  inChargeName,
  licenseNumber,
  openingTime,
  closingTime,
}) => {
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; background: #f4f7fb;">
      <div style="max-width: 700px; margin: auto; background: white; border-radius: 10px; overflow: hidden;">
        <div style="background: #2563eb; color: white; padding: 20px; text-align: center;">
          <h1>Medical Account Created</h1>
        </div>

        <div style="padding: 30px;">
          <h2>Hello ${inChargeName || medicalName},</h2>

          <p>
            Welcome to <b>${hospitalName}</b>. Your medical store account has been created successfully.
          </p>

          <h3 style="margin-top: 30px;">Login Credentials</h3>
          <table width="100%" cellpadding="10" cellspacing="0" style="border-collapse: collapse; margin-top: 10px;">
            <tr style="background: #f1f5f9;">
              <td><b>Email</b></td>
              <td>${email}</td>
            </tr>
            <tr>
              <td><b>Password</b></td>
              <td>${password}</td>
            </tr>
          </table>

          <h3 style="margin-top: 30px;">Medical Details</h3>
          <table width="100%" cellpadding="10" cellspacing="0" style="border-collapse: collapse; margin-top: 10px;">
            <tr style="background: #f1f5f9;">
              <td><b>Medical Name</b></td>
              <td>${medicalName}</td>
            </tr>
            <tr>
              <td><b>Medical Code</b></td>
              <td>${medicalCode}</td>
            </tr>
            <tr style="background: #f1f5f9;">
              <td><b>License Number</b></td>
              <td>${licenseNumber || "-"}</td>
            </tr>
            <tr>
              <td><b>Working Time</b></td>
              <td>${openingTime || "-"} - ${closingTime || "-"}</td>
            </tr>
          </table>

          <div style="margin-top: 30px; padding: 15px; background: #fef3c7; border-radius: 8px;">
            <p style="margin: 0;">Please keep these credentials secure and change your password after first login.</p>
          </div>

          <div style="margin-top: 30px; text-align: center;">
            <a href="http://localhost:5173/login" style="background: #2563eb; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Login Now
            </a>
          </div>

          <p style="margin-top: 30px;">
            Regards,<br />
            <b>${hospitalName} Management Team</b>
          </p>
        </div>
      </div>
    </div>
  `;
};

module.exports = medicalMailTemplate;
