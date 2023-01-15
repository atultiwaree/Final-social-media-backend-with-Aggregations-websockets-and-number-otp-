const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  port: 465, // true for 465, false for other ports
  host: "smtp.gmail.com",
  auth: {
    user: "attiws@gmail.com",
    pass: "hsczvllrhrwrezcl",
  },
  secure: true,
});

const sendMail = (to, subject, html) => {
  const mailData = {
    to: to,
    subject: subject,
    html: html,
  };
  transporter.sendMail(mailData);
};

module.exports = sendMail;
