const ejs = require('ejs');
const path = require('path');

class TemplateService {
  constructor(templateDir) {
    this.templateDir = templateDir;
  }

  async render(templateName, data) {
    const templatePath = path.join(this.templateDir, `${templateName}.ejs`);
    console.log('templatePath :', templatePath);
    try {
      const renderedTemplate = await ejs.renderFile(templatePath, data);
      return renderedTemplate;
    } catch (error) {
      throw new Error(`Error rendering template: ${error.message}`);
    }
  }
}

module.exports = TemplateService;
