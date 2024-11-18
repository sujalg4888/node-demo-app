const transporter = require('../utils/transporter');
const envConfig = require('../config/env');

class EmailService {
  constructor(templateService) {
    this.templateService = templateService;
  }

  async sendEmail(to, subject, templateName, templateData, attachments = []) {
    try {
      const html = await this.templateService.render(templateName, templateData);
      const mailOptions = {
        from: envConfig.sendersEmail,
        to,
        cc: envConfig.defaultCc,
        subject,
        html,
        attachments,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('Email sent:', info.response);
      return info;
    } catch (error) {
      console.error('Error sending email:', error.message);
      throw error;
    }
  }
}

module.exports = EmailService;
