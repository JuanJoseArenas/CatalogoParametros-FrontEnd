module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage'),
      require('karma-junit-reporter'),
      require('@angular-devkit/build-angular/plugins/karma')
    ],
    client: {
      jasmine: {},
      clearContext: false
    },
    coverageReporter: {
      dir: require('path').join(__dirname, 'coverage/catalogo-parametros-front'),
      subdir: '.',
      reporters: [
        { type: 'html' },
        { type: 'lcovonly' },
        { type: 'cobertura', file: 'cobertura-coverage.xml' },
        { type: 'text-summary' }
      ]
    },
    junitReporter: {
      outputDir: 'test-results',
      outputFile: 'junit.xml',
      useBrowserName: false
    },
    reporters: ['progress', 'kjhtml', 'junit'],
    browsers: ['Chrome'],
    restartOnFileChange: true
  });
};
