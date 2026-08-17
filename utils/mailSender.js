const nodemailer = require("nodemailer");

const mailSender = async (email, title, body) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: `"MediCore Hospital Management System" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: title,
      html: body,
    });

    return info;
  } catch (error) {
    console.log(error.message);
    throw error;
  }
};

module.exports = mailSender;
