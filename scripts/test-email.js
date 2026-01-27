const nodemailer = require("nodemailer");
require("dotenv").config(); // Load .env by default if .env.local fails or is empty

async function testEmail() {
  console.log("Testing email configuration...");
  console.log("Host:", process.env.NEXT_PUBLIC_EMAIL_SERVER_HOST);
  console.log("Port:", process.env.NEXT_PUBLIC_EMAIL_SERVER_PORT);
  console.log("User:", process.env.NEXT_PUBLIC_EMAIL_SERVER_USER);
  
  if (!process.env.NEXT_PUBLIC_EMAIL_SERVER_USER || !process.env.NEXT_PUBLIC_EMAIL_SERVER_PASSWORD) {
    console.error("Error: NEXT_PUBLIC_EMAIL_SERVER_USER or NEXT_PUBLIC_EMAIL_SERVER_PASSWORD not found in environment variables.");
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.NEXT_PUBLIC_EMAIL_SERVER_HOST,
    port: Number(process.env.NEXT_PUBLIC_EMAIL_SERVER_PORT),
    secure: true, // Use true for 465, false for other ports
    auth: {
      user: process.env.NEXT_PUBLIC_EMAIL_SERVER_USER,
      pass: process.env.NEXT_PUBLIC_EMAIL_SERVER_PASSWORD,
    },
    debug: true, // Enable debug output
    logger: true // Log information to console
  });

  try {
    const info = await transporter.verify();
    console.log("Server connection verified:", info);

    const sendInfo = await transporter.sendMail({
      from: `"Test Script" <${process.env.NEXT_PUBLIC_EMAIL_SERVER_USER}>`,
      to: process.env.NEXT_PUBLIC_EMAIL_SERVER_USER, // Send to yourself
      subject: "Test Email from Console",
      text: "If you see this, your SMTP configuration is working!",
      html: "<b>If you see this, your SMTP configuration is working!</b>",
    });

    console.log("Message sent: %s", sendInfo.messageId);
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(sendInfo));
  } catch (error) {
    console.error("Error sending email:", error);
  }
}

testEmail();
