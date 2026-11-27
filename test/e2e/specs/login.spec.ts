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

  test('links new users to the access request (or account creation) form', async ({ page }) => {
    const createAccount = page.getByTestId('login-create-account')
    await expect(createAccount).toContainText('No account yet?')
    await createAccount.getByRole('link', { name: /^(Request access|Create an account)$/ }).click()

    await expect(page).toHaveURL(/\/guest\/accessRequest/)
  })
})
