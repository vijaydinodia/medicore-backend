const sgMail = require("@sendgrid/mail");

const removeWrappingQuotes = (value) => {
  let cleanValue = value.trim();

  if (cleanValue.startsWith('"') && cleanValue.endsWith('"')) {
    cleanValue = cleanValue.slice(1, -1);
  }

  return cleanValue;
};

const getSendGridFrom = () => {
  const fromEmail =
    process.env.SENDGRID_FROM_EMAIL_ADDRESS || process.env.SENDGRID_FROM_EMAIL;

  if (!fromEmail) {
    return "noreply@example.com";
  }

  const hasOpeningBracket = fromEmail.includes("<");
  const hasClosingBracket = fromEmail.includes(">");

  if (hasOpeningBracket && hasClosingBracket) {
    const emailParts = fromEmail.split("<");

    let senderName = emailParts[0];
    let senderEmail = emailParts[1];

    senderName = senderName.replaceAll('"', "").trim();
    senderEmail = senderEmail.replace(">", "").trim();

    return {
      name: senderName,
      email: senderEmail,
    };
  }

  return fromEmail;
};

// const nodemailer = require("nodemailer");
//
// const mailSender = async (email, title, body) => {
//   try {
//     const transporter = nodemailer.createTransport({
//       service: "gmail",
//       auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASS,
//       },
//     });
//
//     const info = await transporter.sendMail({
//       from: `"Hospital Management System" <${process.env.MAIL_USER}>`,
//       to: email,
//       subject: title,
//       html: body,
//     });
//
//     return info;
//   } catch (error) {
//     console.log(error.message);
//     throw error;
//   }
// };

// const { Resend } = require("resend");
//
// const mailSender = async (email, title, body) => {
//   try {
//     if (!process.env.RESEND_API_KEY) {
//       throw new Error("RESEND_API_KEY is not configured");
//     }
//
//     const resend = new Resend(process.env.RESEND_API_KEY);
//     const { data, error } = await resend.emails.send({
//       from:
//         process.env.RESEND_FROM_EMAIL ||
//         "Hospital Management System <onboarding@resend.dev>",
//       to: email,
//       subject: title,
//       html: body,
//     });
//
//     if (error) {
//       throw new Error(error.message || "Failed to send email with Resend");
//     }
//
//     return data;
//   } catch (error) {
//     console.log(error.message);
//     throw error;
//   }
// };

const mailSender = async (email, title, body) => {
  try {
    const rawSendGridApiKey = process.env.SENDGRID_API_KEY || "";
    const sendGridApiKey = removeWrappingQuotes(rawSendGridApiKey);

    if (!sendGridApiKey) {
      throw new Error("SENDGRID_API_KEY is not configured");
    }

    if (!sendGridApiKey.startsWith("SG.")) {
      throw new Error("Invalid SendGrid API key. SendGrid API key must start with SG.");
    }

    sgMail.setApiKey(sendGridApiKey);

    const info = await sgMail.send({
      from: getSendGridFrom(),
      to: email,
      subject: title,
      html: body,
    });

    return info;
  } catch (error) {
    const sendGridMessage =
      error.response?.body?.errors?.[0]?.message ||
      error.response?.body?.message ||
      error.message;

    console.log(sendGridMessage);
    throw new Error(sendGridMessage);
  }
};

module.exports = mailSender;
