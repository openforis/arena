import { openBrowser as openBrowserTaiko, goto } from 'taiko'

export { closeBrowser, reload } from 'taiko'

const headless = process.env.HEADLESS_CHROME === 'true'

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

  await goto('localhost:9090')
}
