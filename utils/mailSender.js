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

const sendViaBrevoAPI = (toEmail, title, body) => {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.BREVO_API_KEY || process.env.SMTP_KEY;
    if (!apiKey) {
      return reject(new Error("BREVO_API_KEY / SMTP_KEY is not configured in environment variables."));
    }

    const { name: fromName, email: fromEmail } = parseFromEmail(
      process.env.BREVO_FROM_EMAIL || process.env.SENDGRID_FROM_EMAIL || process.env.EMAIL_USER
    );

    const postData = JSON.stringify({
      sender: {
        name: fromName,
        email: fromEmail,
      },
      to: [
        {
          email: toEmail,
        },
      ],
      subject: title,
      htmlContent: body,
    });

    const options = {
      hostname: "api.brevo.com",
      port: 443,
      path: "/v3/smtp/email",
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
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
          try {
            const parsed = JSON.parse(responseData);
            resolve({ success: true, messageId: parsed.messageId || responseData });
          } catch (e) {
            resolve({ success: true, messageId: responseData });
          }
        } else {
          reject(new Error(`Brevo API failed (${res.statusCode}): ${responseData}`));
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
  try {
    const result = await sendViaBrevoAPI(email, title, body);
    console.log("Email sent via Brevo API to:", email);
    return result;
  } catch (error) {
    console.error("Brevo email delivery failed:", error.message);
    throw error;
  }
};

module.exports = mailSender;
