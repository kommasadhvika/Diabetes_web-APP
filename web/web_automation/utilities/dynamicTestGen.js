const fs = require('fs');
const path = require('path');
const logger = require('./logger');

class DynamicTestGen {
  static discoverRoutesAndForms() {
    logger.info('=== STARTING SMART DYNAMIC TEST DISCOVERY ===');
    const appJsxPath = path.join(__dirname, '../../frontend/src/App.jsx');
    const discovered = {
      routes: [],
      forms: []
    };

    if (!fs.existsSync(appJsxPath)) {
      logger.warn(`App.jsx not found at ${appJsxPath}. Utilizing default mock routes.`);
      return this.getDefaultDiscoveryFallback();
    }

    try {
      // 1. Discover React routes from App.jsx
      const appContent = fs.readFileSync(appJsxPath, 'utf8');
      const routeRegex = /path=["']([^"']+)["']\s+element=\{<([^/\s>]+)/g;
      let match;
      
      while ((match = routeRegex.exec(appContent)) !== null) {
        discovered.routes.push({
          path: match[1],
          componentName: match[2]
        });
      }
      logger.info(`Discovered ${discovered.routes.length} React router endpoints dynamically.`);

      // 2. Discover input forms and rules from components
      const pagesDir = path.join(__dirname, '../../frontend/src/pages');
      if (fs.existsSync(pagesDir)) {
        const files = fs.readdirSync(pagesDir);
        for (const file of files) {
          if (file.endsWith('.jsx')) {
            const pagePath = path.join(pagesDir, file);
            const content = fs.readFileSync(pagePath, 'utf8');
            
            // Look for <form> tags or useState forms
            if (content.includes('<form') || content.includes('handleSubmit')) {
              const componentName = path.basename(file, '.jsx');
              const inputs = [];
              
              // Extract state fields / text fields
              const inputRegex = /<input[^>]*name=["']([^"']+)["'][^>]*>/g;
              let inputMatch;
              while ((inputMatch = inputRegex.exec(content)) !== null) {
                inputs.push(inputMatch[1]);
              }
              
              // Standard fallback detections if name attribute is missing
              if (inputs.length === 0) {
                if (content.includes('email')) inputs.push('email');
                if (content.includes('password')) inputs.push('password');
                if (content.includes('age')) inputs.push('age');
                if (content.includes('height')) inputs.push('height');
                if (content.includes('weight')) inputs.push('weight');
              }

              discovered.forms.push({
                componentName,
                formFields: [...new Set(inputs)],
                rules: {
                  required: content.includes('required') || content.includes('!value'),
                  emailValidation: content.includes('email') || content.includes('@'),
                  minMaxValidation: content.includes('min') || content.includes('max')
                }
              });
            }
          }
        }
      }
      logger.info(`Discovered ${discovered.forms.length} interactive forms automatically.`);
      return discovered;
    } catch (error) {
      logger.error(`Error during dynamic routing discovery: ${error.message}`);
      return this.getDefaultDiscoveryFallback();
    }
  }

  static getDefaultDiscoveryFallback() {
    return {
      routes: [
        { path: '/', componentName: 'Landing' },
        { path: '/login', componentName: 'Login' },
        { path: '/signup', componentName: 'Signup' },
        { path: '/dashboard', componentName: 'Dashboard' },
        { path: '/profile', componentName: 'UserProfile' },
        { path: '/sugar-tracking', componentName: 'SugarTracking' },
        { path: '/diet-plan', componentName: 'DietPlan' },
        { path: '/chatbot', componentName: 'Chatbot' }
      ],
      forms: [
        { componentName: 'Login', formFields: ['email', 'password'], rules: { required: true, emailValidation: true } },
        { componentName: 'Signup', formFields: ['name', 'email', 'password', 'phone'], rules: { required: true, emailValidation: true } },
        { componentName: 'UserProfile', formFields: ['age', 'height', 'weight', 'gender', 'activityLevel'], rules: { required: true, minMaxValidation: true } }
      ]
    };
  }
}

module.exports = DynamicTestGen;
