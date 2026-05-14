const doctorMailTemplate = ({
  doctorName,
  email,
  password,
  hospitalName,
  departmentName,
  subDepartmentName,
  specialization,
  qualification,
  experience,
  consultationFee,
  startTime,
  endTime,
}) => {
  return `
    
    <div style="font-family: Arial, sans-serif; padding: 20px; background: #f4f7fb;">
      
      <div style="max-width: 700px; margin: auto; background: white; border-radius: 10px; overflow: hidden;">
        
        <div style="background: #2563eb; color: white; padding: 20px; text-align: center;">
          <h1>Doctor Account Created</h1>
        </div>

        <div style="padding: 30px;">

          <h2>Hello Dr. ${doctorName},</h2>

          <p>
            Welcome to <b>${hospitalName}</b>.
            Your doctor account has been created successfully.
          </p>

          <h3 style="margin-top: 30px;">
            Login Credentials
          </h3>

          <table 
            width="100%" 
            cellpadding="10" 
            cellspacing="0" 
            style="border-collapse: collapse; margin-top: 10px;"
          >
            <tr style="background: #f1f5f9;">
              <td><b>Email</b></td>
              <td>${email}</td>
            </tr>

            <tr>
              <td><b>Password</b></td>
              <td>${password}</td>
            </tr>
          </table>

          <h3 style="margin-top: 30px;">
            Doctor Details
          </h3>

          <table 
            width="100%" 
            cellpadding="10" 
            cellspacing="0" 
            style="border-collapse: collapse; margin-top: 10px;"
          >

            <tr style="background: #f1f5f9;">
              <td><b>Hospital</b></td>
              <td>${hospitalName}</td>
            </tr>

            <tr>
              <td><b>Department</b></td>
              <td>${departmentName}</td>
            </tr>

            <tr style="background: #f1f5f9;">
              <td><b>Sub Department</b></td>
              <td>${subDepartmentName}</td>
            </tr>

            <tr>
              <td><b>Specialization</b></td>
              <td>${specialization}</td>
            </tr>

            <tr style="background: #f1f5f9;">
              <td><b>Qualification</b></td>
              <td>${qualification}</td>
            </tr>

            <tr>
              <td><b>Experience</b></td>
              <td>${experience} Years</td>
            </tr>

            <tr style="background: #f1f5f9;">
              <td><b>Consultation Fee</b></td>
              <td>₹${consultationFee}</td>
            </tr>

            <tr>
              <td><b>Working Time</b></td>
              <td>${startTime} - ${endTime}</td>
            </tr>

          </table>

          <div style="margin-top: 30px; padding: 15px; background: #fef3c7; border-radius: 8px;">
            <p style="margin: 0;">
              Please change your password after first login.
            </p>
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

module.exports = doctorMailTemplate;