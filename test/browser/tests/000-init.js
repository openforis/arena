/* globals beforeSuite, afterSuite */
const { openBrowser, closeBrowser } = require('taiko')

const headless = Boolean(process.env.HEADLESS_CHROME)

beforeSuite(async () => {
  await openBrowser({
    headless,
    args: headless
      ? [
          // These are recommended args that has to be passed when running in Docker
          '--disable-gpu',
          '--disable-dev-shm-usage',
          '--disable-setuid-sandbox',
          '--no-first-run',
          '--no-sandbox',
          '--no-zygote',
        ]
      : [],
  })
})

afterSuite(async () => {
  await closeBrowser()
})
