const { goto, text } = require('taiko')

const { LoginSuccessful, LoginForm, openBrowser, closeBrowser } = require('../fixtures')

describe('The user must be able to login with correct credentials and receive an error message with incorrect credentials', () => {
  beforeAll(async () => {
    await openBrowser()
  })

  describe('Unsuccessful Login', () => {
    test('Goto Arena login page', async () => {
      await goto('localhost:9090')
    })

    test('Login with "test@arena.com" and "error""', LoginForm({ username: 'test@arena.com', password: 'error' }))

    test('Page contains "User not found. Make sure email and password are correct"', async () => {
      const errorMessage = await text('User not found. Make sure email and password are correct').exists()
      await expect(errorMessage).toBeTruthy()
    })
  })

  describe('Successful Login', LoginSuccessful)

  afterAll(async () => {
    await closeBrowser()
  })
})
