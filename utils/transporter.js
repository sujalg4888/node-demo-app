const nodemailer = require('nodemailer');
const envConfig = require('../config/env');

const transporter = nodemailer.createTransport({
  host: envConfig.emailHost,
  port: envConfig.emailPort,
  secure: false, // use SSL
  auth: envConfig.emailAuth,
});

module.exports = transporter;
