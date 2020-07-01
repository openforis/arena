const { openBrowser, closeBrowser, $, goto, waitFor, press, write, click, into, textBox, text } = require('taiko')

const headless = Boolean(process.env.HEADLESS_CHROME)

describe('The user must be able to login with correct credentials and receive an error message with incorrect credentials', () => {
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

  describe('Unsuccessful Login', () => {
    test('Goto Arena login page', async () => {
      await goto('localhost:9090')
    })

    test('Login with "test@arena.com" and "error""', async () => {
      const username = 'test@arena.com'

      const password = 'error'
      await write(username, into(textBox({ placeholder: 'Your email' })))
      await write(password, into(textBox({ placeholder: 'Your password' })))
      await click('Login')
    })

    test('Page contains "User not found. Make sure email and password are correct"', async () => {
      const errorMessage = await text('User not found. Make sure email and password are correct').exists()
      await expect(errorMessage).toBeTruthy()
    })
  })

  describe('Successful Login', () => {
    test('Goto Arena login page', async () => {
      await goto('localhost:9090')
    })

    test('Login with "test@arena.com" and "test"', async () => {
      const username = 'test@arena.com'
      const password = 'test'
      await write(username, into(textBox({ placeholder: 'Your email' })))
      await write(password, into(textBox({ placeholder: 'Your password' })))
      await click('Login')
    })

    test('Page contains .header', async () => {
      const header = await $('.header').exists()
      await expect(header).toBeTruthy()
    })
  })

  afterAll(async () => {
    await closeBrowser()
  })
})
