import nodemailer from "nodemailer";

// Ensure environment variables are loaded if not already (for some script execution contexts)
// Note: Next.js usually handles this automatically, but explicit check helps debugging.
if (!process.env.NEXT_PUBLIC_EMAIL_SERVER_HOST) {
  // console.warn("Email environment variables might be missing!");
}

const transporter = nodemailer.createTransport({
  host: process.env.NEXT_PUBLIC_EMAIL_SERVER_HOST,
  port: Number(process.env.NEXT_PUBLIC_EMAIL_SERVER_PORT),
  secure: true,
  auth: {
    user: process.env.NEXT_PUBLIC_EMAIL_SERVER_USER,
    pass: process.env.NEXT_PUBLIC_EMAIL_SERVER_PASSWORD
  }
});

transporter.verify(function (error, success) {
  if (error) {
    console.error("Transporter verification error:", error);
  } else {
    console.log("Server is ready to take our messages");
  }
});

export const sendEmail = async ({
  to,
  subject,
  html
}: {
  to: string;
  subject: string;
  html: string;
}) => {
  try {
    const info = await transporter.sendMail({
      from: `"Conecta" <${process.env.NEXT_PUBLIC_EMAIL_SERVER_USER}>`,
      to,
      subject,
      html
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error };
  }
};
