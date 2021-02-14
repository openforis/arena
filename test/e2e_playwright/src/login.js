import { user } from '../mock/user'

export default () =>
  describe('Login', () => {
    it('Login Unsuccessful', async () => {
      // Click input[name="email"]
      await page.click('input[name="email"]')

      // Fill input[name="email"]
      await page.fill('input[name="email"]', user.email)

      // Press Tab
      await page.press('input[name="email"]', 'Tab')

      // Fill input[name="password"]
      await page.fill('input[name="password"]', 'fsdfdsafdsa')

      // Click text="Login"
      await page.click('text="Login"')

      await expect(page).toHaveText('.guest-errors', 'User not found. Make sure email and password are correct')
    })

    it('Login Successful', async () => {
      // Click input[name="password"]
      await page.click('input[name="password"]')

      // Press ArrowRight with modifiers
      await page.press('input[name="password"]', 'Meta+ArrowRight')

      // Fill input[name="password"]
      await page.fill('input[name="password"]', user.password)

      // Click text="Login"
      await Promise.all([page.waitForResponse('**/auth/login'), page.click('text="Login"')])
      await page.waitForTimeout(1000)

      const header = await page.$('.header')
      await expect(header).not.toBe(null)
    })
  })
