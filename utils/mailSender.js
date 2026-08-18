const nodemailer = require("nodemailer");
const https = require("https");

const parseFromEmail = (rawFrom) => {
  if (!rawFrom) {
    return { name: "MediCore Hospital Management System", email: process.env.EMAIL_USER || "dinodiavijay53@gmail.com" };
  }
  const match = rawFrom.match(/^(?:"?([^"<]+)"?\s*)?<?([^>]+)>?$/);
  if (match) {
    const name = match[1] ? match[1].trim() : "MediCore Hospital Management System";
    const email = match[2] ? match[2].trim() : rawFrom.trim();
    return { name, email };
  }
  return { name: "MediCore Hospital Management System", email: rawFrom.trim() };
};

const sendViaSendGridAPI = (toEmail, title, body) => {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.SENDGRID_API_KEY;
    const { name: fromName, email: fromEmail } = parseFromEmail(process.env.SENDGRID_FROM_EMAIL);

    const postData = JSON.stringify({
      personalizations: [
        {
          to: [{ email: toEmail }],
        },
      ],
      from: {
        email: fromEmail,
        name: fromName,
      },
      subject: title,
      content: [
        {
          type: "text/html",
          value: body,
        },
      ],
    });

    const options = {
      hostname: "api.sendgrid.com",
      port: 443,
      path: "/v3/mail/send",
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, (res) => {
      let responseData = "";
      res.on("data", (chunk) => {
        responseData += chunk;
      });
      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true, messageId: res.headers["x-message-id"] || "sendgrid-api" });
        } else {
          reject(new Error(`SendGrid API failed (${res.statusCode}): ${responseData}`));
        }
      });
    });

    req.on("error", (err) => {
      reject(err);
    });

    req.write(postData);
    req.end();
  });
};

const mailSender = async (email, title, body) => {
  const errors = [];

  // Priority 1: SendGrid HTTP API
  if (process.env.SENDGRID_API_KEY) {
    try {
      const result = await sendViaSendGridAPI(email, title, body);
      console.log("Email sent via SendGrid API to:", email);
      return result;
    } catch (sgError) {
      console.warn("SendGrid API failed, trying fallback:", sgError.message);
      errors.push(`SendGrid: ${sgError.message}`);
    }
  }

  // Priority 2: Brevo / Custom SMTP via Nodemailer
  if (process.env.SMTP_USER && process.env.SMTP_KEY) {
    try {
      const transporter = nodemailer.createTransport({
        host: "smtp-relay.brevo.com",
        port: 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_KEY,
        },
      });

      const { name, email: fromEmail } = parseFromEmail(process.env.SENDGRID_FROM_EMAIL);
      const info = await transporter.sendMail({
        from: `"${name}" <${fromEmail}>`,
        to: email,
        subject: title,
        html: body,
      });
      console.log("Email sent via Brevo SMTP to:", email);
      return info;
    } catch (brevoError) {
      console.warn("Brevo SMTP failed, trying fallback:", brevoError.message);
      errors.push(`Brevo: ${brevoError.message}`);
    }
  }

  // Priority 3: Default Nodemailer (Gmail with App Password)
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    try {
      const cleanPass = process.env.EMAIL_PASS.replace(/\s+/g, "");
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: cleanPass,
        },
      });

      const info = await transporter.sendMail({
        from: `"MediCore Hospital Management System" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: title,
        html: body,
      });

      console.log("Email sent via Gmail SMTP to:", email);
      return info;
    } catch (gmailError) {
      console.warn("Gmail SMTP failed:", gmailError.message);
      errors.push(`Gmail: ${gmailError.message}`);
    }
  }

  throw new Error(`Failed to send email. Providers attempted: ${errors.join(" | ")}`);
};

module.exports = mailSender;

