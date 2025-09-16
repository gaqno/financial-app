export default {
  // Basic Prettier configuration
  semi: true,
  singleQuote: true,
  trailingComma: 'es5',
  tabWidth: 2,
  useTabs: false,
  printWidth: 120, // Allow longer lines for single attributes
  endOfLine: 'lf',
  
  // Vue.js specific configuration
  vueIndentScriptAndStyle: true,
  
  // HTML configuration for Vue templates
  htmlWhitespaceSensitivity: 'css',
  
  // Only split attributes when there are actually multiple attributes
  singleAttributePerLine: false, // Allow single attributes to stay on one line
  
  // Override for specific file types
  overrides: [
    {
      files: ['*.vue'],
      options: {
        parser: 'vue',
        singleAttributePerLine: false, // Allow single attributes on one line
        htmlWhitespaceSensitivity: 'css',
      },
    },
    {
      files: ['*.html'],
      options: {
        parser: 'html',
        singleAttributePerLine: false,
      },
    },
    {
      files: ['*.js', '*.ts'],
      options: {
        parser: 'typescript',
        singleAttributePerLine: false, // JS/TS doesn't need this
      },
    },
  ],
};
