const { openBrowser, closeBrowser, $, goto, waitFor, press, write, click, into, textBox, text } = require('taiko')

const headless = Boolean(process.env.HEADLESS_CHROME)

describe('Getting Started with Jest and Taiko', () => {
  beforeAll(async () => {
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

  describe('Search Taiko Repository', () => {
    test('Goto getgauge github page', async () => {
      await goto('localhost:9090')
    })

    test('Search for "Taiko"', async () => {
      const username = 'test@arena.com'

      const password = 'error'
      await write(username, into(textBox({ placeholder: 'Your email' })))
      await write(password, into(textBox({ placeholder: 'Your password' })))
      await click('Login')
    })

    test('Page contains "getgauge/taiko"', async () => {
      const a = await text('User not found. Make sure email and password are correct').exists()
      await expect(a).toBeTruthy()
    })
  })

  describe('Search Taiko Repository', () => {
    test('Goto getgauge github page', async () => {
      await goto('localhost:9090')
    })

    test('Search for "Taiko"', async () => {
      const username = 'test@arena.com'
      const password = 'test'
      await write(username, into(textBox({ placeholder: 'Your email' })))
      await write(password, into(textBox({ placeholder: 'Your password' })))
      await click('Login')
    })

    test('Page contains "getgauge/taiko"', async () => {
      const a = await text('----').exists()
      await expect(a).toBeTruthy()
    })
  })

  afterAll(async () => {
    await closeBrowser()
  })
})
