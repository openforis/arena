const { $, goto, write, click, into, textBox } = require('taiko')

export const LoginForm = ({ username, password }) => async () => {
  await write(username, into(textBox({ placeholder: 'Your email' })))
  await write(password, into(textBox({ placeholder: 'Your password' })))
  await click('Login')
}

export const LoginSuccessful = () => {
  test('Goto Arena login page', async () => {
    await goto('localhost:9090')
  })

  test('Login with "test@arena.com" and "test"', LoginForm({ username: 'test@arena.com', password: 'test' }))

  test('Page contains .header', async () => {
    const header = await $('.header').exists()
    await expect(header).toBeTruthy()
  })
}
