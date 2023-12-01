import { user } from '../mock/user'

export default () =>
  describe('Login', () => {
    test('Login Unsuccessful', async () => {
      // Fill input[name="email"]
      await page.fill('input[name="email"]', user.email)

      // Fill input[name="password"]
      await page.fill('input[name="password"]', 'fsdfdsafdsa')

      // Click text="Login"
      await page.click('text="Login"')

      await expect(page).toHaveText('.guest-errors', 'User not found. Make sure email and password are correct')
    })

    test('Login Successful', async () => {
      // Fill input[name="password"]
      await page.fill('input[name="password"]', user.password)

      // Click text="Login"
      await Promise.all([
        page.waitForNavigation(/* { url: `${BASE_URL}/app/home/dashboard/` } */),
        page.click('text="Login"'),
      ])

      const header = await page.$('.app-header')
      await expect(header).not.toBe(null)
    })
  })
