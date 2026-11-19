import { expect, test } from '../fixtures'

test.use({ authenticated: false })

test.describe('Login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('shows an error when the password is wrong', async ({ page, testUser }) => {
    await page.locator('input[name="email"]').fill(testUser.email)
    await page.locator('input[name="password"]').fill('wrong_password')
    await page.getByRole('button', { name: 'Login', exact: true }).click()

    await expect(page.locator('.guest-errors')).toHaveText('User not found. Make sure email and password are correct')
  })

  test('logs in with valid credentials', async ({ page, testUser }) => {
    await page.locator('input[name="email"]').fill(testUser.email)
    await page.locator('input[name="password"]').fill(testUser.password)
    await page.getByRole('button', { name: 'Login', exact: true }).click()

    await expect(page.locator('.app-header')).toBeVisible()
    await expect(page).toHaveURL(/\/app\//)
  })

  test('invites new users to request access before logging in', async ({ page }) => {
    const banner = page.getByTestId('login-request-access-banner')
    await expect(banner).toContainText('only registered users can log in')
    await banner.getByRole('link', { name: 'Request access' }).click()

    await expect(page).toHaveURL(/\/guest\/accessRequest/)
  })
})
