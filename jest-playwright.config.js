// https://github.com/playwright-community/jest-playwright/#configuration
module.exports = {
  // browsers: ['chromium', 'firefox', 'webkit'],
  browsers: ['chromium'],
  exitOnPageError: false, // GitHub currently throws errors
  launchOptions: {
    headless: true,
  },
}
