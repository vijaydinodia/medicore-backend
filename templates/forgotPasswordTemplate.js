const forgotPasswordTemplate = (name, otp) => {
  return `
    <div style="margin:0; padding:0; background-color:#f4f7fb; font-family:Arial, sans-serif;">
      
      <div style="max-width:600px; margin:40px auto; background:#ffffff; border-radius:10px; overflow:hidden; box-shadow:0 4px 10px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div style="background:#2563eb; padding:25px; text-align:center;">
          <h1 style="color:#ffffff; margin:0;">
            Hospital Management System
          </h1>
        </div>

        <!-- Body -->
        <div style="padding:35px; color:#333333;">
          
          <h2 style="margin-top:0;">
            Hello ${name},
          </h2>

          <p style="font-size:16px; line-height:1.6;">
            We received a request to reset your password.
            Use the OTP below to continue with your password reset process.
          </p>

          <!-- OTP Box -->
          <div style="margin:30px 0; text-align:center;">
            <div style="
              display:inline-block;
              background:#eff6ff;
              border:2px dashed #2563eb;
              padding:18px 35px;
              border-radius:8px;
              font-size:32px;
              font-weight:bold;
              letter-spacing:6px;
              color:#2563eb;
            ">
              ${otp}
            </div>
          </div>

          <p style="font-size:15px; color:#555555;">
            This OTP is valid for 
            <strong>10 minutes</strong>.
          </p>

          <p style="font-size:15px; color:#555555;">
            If you did not request a password reset, please ignore this email.
          </p>

          <hr style="border:none; border-top:1px solid #eeeeee; margin:30px 0;" />

          <p style="font-size:14px; color:#888888;">
            Regards,<br/>
            Hospital Management Team
          </p>

        </div>
      </div>
    </div>
  `;
};

module.exports = forgotPasswordTemplate;
