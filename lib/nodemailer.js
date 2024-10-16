import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.office365.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.MAIL_USERNAME,
    pass: process.env.MAIL_PASSWORD,
  },
  tls: {
    ciphers: "SSLv3",
    rejectUnauthorized: true,
  },
});

export const sendEmail = async (options) => {
  try {
    const { to, subject, html, attachments } = options;

    const info = await transporter.sendMail({
      from: '"CLC Admissions" <admissions@clc-london.ac.uk>',
      to,
      subject,
      html,
      attachments,
    });

    console.log("Message sent: %s", info.messageId);
    return { messageId: info.messageId, error: null };
  } catch (error) {
    console.log(error);
    return { messageId: null, error: error };
  }
};
