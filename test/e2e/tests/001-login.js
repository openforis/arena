import { click } from 'taiko'
import { clearTextBox, expectExists, writeIntoTextBox } from '../utils'

const selectorEmail = { placeholder: 'Your email' }
const selectorPassword = { placeholder: 'Your password' }

const login = async ({ username, password }) => {
  await writeIntoTextBox({ text: username, selector: selectorEmail })
  await writeIntoTextBox({ text: password, selector: selectorPassword })
  await click('Login')
}

describe('Login', () => {
  test('Unsuccessful Login', async () => {
    await login({ username: 'test@arena.com', password: 'error' })

    await expectExists({ text: 'User not found. Make sure email and password are correct' })
  })

  test('Successful Login', async () => {
    await clearTextBox({ selector: selectorEmail })
    await clearTextBox({ selector: selectorPassword })

    await login({ username: 'test@arena.com', password: 'test' })

    await expectExists({ selector: '.header' })
  })
})
