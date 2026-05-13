exports.hospitalApprovedTemplate = (hospitalName, email, password) => {
  return `
  
  <div style="font-family: Arial, sans-serif; background-color: #f4f7fb; padding: 30px;">

    <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">

      <!-- Header -->
      <div style="background: #2563eb; padding: 20px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0;">
          MediCore Hospital Management
        </h1>
      </div>

      <!-- Body -->
      <div style="padding: 30px; color: #333333;">

        <h2 style="margin-top: 0;">
          Hospital Approved Successfully
        </h2>

        <p>
          Dear <strong>${hospitalName}</strong>,
        </p>

        <p>
          Congratulations! Your hospital registration request has been 
          <strong style="color: green;">approved</strong> by the MediCore administration team.
        </p>

        <p>
          You can now access your hospital dashboard using the credentials below:
        </p>

        <!-- Credentials Box -->
        <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0;">

          <p style="margin: 8px 0;">
            <strong>Email:</strong> ${email}
          </p>

          <p style="margin: 8px 0;">
            <strong>Password:</strong> ${password}
          </p>

        </div>

        <p>
          Please login and change your password after your first login for security purposes.
        </p>

        <!-- Button -->
        <div style="text-align: center; margin-top: 30px;">

          <a 
            href="http://localhost:5173/login"
            style="
              background: #2563eb;
              color: #ffffff;
              padding: 12px 25px;
              text-decoration: none;
              border-radius: 6px;
              display: inline-block;
              font-weight: bold;
            "
          >
            Login Now
          </a>

        </div>

        <p style="margin-top: 30px;">
          Thank you,<br />
          <strong>MediCore Team</strong>
        </p>

      </div>

      <!-- Footer -->
      <div style="background: #f8fafc; padding: 15px; text-align: center; font-size: 12px; color: #666666;">

        © 2026 MediCore Hospital Management System. All rights reserved.

      </div>

    </div>
  </div>
  
  `;
};
