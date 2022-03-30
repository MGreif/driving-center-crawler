const nodemailer = require('nodemailer')

const sendMail = async (stringifiedHtml = "") => {
  const {
    NODEMAILER_HOST,
    NODEMAILER_PORT,
    NODEMAILER_SECURE,
    NODEMAILER_USER,
    NODEMAILER_PASSWORD,
    NODEMAILER_RECIPIENTS,
    NODEMAILER_SEND_MAILS
  } = process.env

  if (NODEMAILER_SEND_MAILS === false) {
    return
  }

  if (!NODEMAILER_HOST) {
    throw new Error("No Mailserver settings configured")
  }

  const transporter = nodemailer.createTransport({
    host: NODEMAILER_HOST,
    port: NODEMAILER_PORT,
    secure: NODEMAILER_SECURE,
    auth: {
      user: NODEMAILER_USER,
      pass: NODEMAILER_PASSWORD,
    },
  });

    const info = await transporter.sendMail({
      from: NODEMAILER_USER,
      to: NODEMAILER_RECIPIENTS,
      subject: "Drivingcenter Results ✔",
      html: stringifiedHtml
    });

    console.log(`[X] EMAIL SENT TO ${NODEMAILER_RECIPIENTS} - ${info.messageId}`)

  return info
}

module.exports = { sendMail }