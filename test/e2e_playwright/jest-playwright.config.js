const headless = process.env.PWDEBUG !== '1'
// https://github.com/playwright-community/jest-playwright/#configuration
module.exports = {
  // browsers: ['chromium', 'firefox', 'webkit'],
  browsers: ['chromium'],
  exitOnPageError: true,
  launchOptions: {
    headless,
    slowMo: headless ? null : 500,
  },
  contextOptions: {
    geolocation: {
      latitude: 41.890221,
      longitude: 12.492348,
    },
    locale: 'it-IT',
    timezoneId: 'Europe/Rome',
    viewport: {
      width: 1366,
      height: 768,
    },
  },
}
