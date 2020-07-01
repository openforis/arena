const { openBrowser: openBrowserTaiko, closeBrowser: closeBrowserTaiko } = require('taiko')

const headless = Boolean(process.env.HEADLESS_CHROME)

export const openBrowser = async () => {
  await openBrowserTaiko({
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
}

export const closeBrowser = async () => {
  await closeBrowserTaiko()
}
