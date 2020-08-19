const { $, clear, click, into, textBox, text, waitFor, write } = require('taiko')

const getInputEmail = () => textBox({ placeholder: 'Your email' })
const getInputPassword = () => textBox({ placeholder: 'Your password' })

const login = async ({ username, password }) => {
  await write(username, into(getInputEmail()))
  await write(password, into(getInputPassword()))

  await click('Login')
}

describe('Login', () => {
  test('Unsuccessful Login', async () => {
    await login({ username: 'test@arena.com', password: 'error' })
    await waitFor(1000)
    const errorMessage = await text('User not found. Make sure email and password are correct').exists()
    await expect(errorMessage).toBeTruthy()
  })

  test('Successful Login', async () => {
    await clear(getInputEmail())
    await clear(getInputPassword())
    await login({ username: 'test@arena.com', password: 'test' })
    await waitFor(1000)

    const header = await $('.header').exists()
    await expect(header).toBeTruthy()
  })
})
