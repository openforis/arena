import { expect, test } from '../fixtures'
import { MockOidcProvider } from '../helpers/mockOidcProvider'

// sign-in with an external OpenID Connect provider (a mock provider that signs in immediately)
const mockProvider = new MockOidcProvider()

const getProviderId = (parallelIndex: number): string => `e2e-oidc-${parallelIndex}`

test.describe('External login (OpenID Connect)', () => {
  test.beforeAll(async () => {
    await mockProvider.start()
  })

  test.afterAll(() => {
    mockProvider.stop()
  })

  test.beforeEach(async ({ api }, testInfo) => {
    const id = getProviderId(testInfo.parallelIndex)
    await api.deleteAuthProviderIfExists(id)
    await api.createAuthProvider({
      id,
      type: 'oidc',
      props: { label: `E2E SSO ${testInfo.parallelIndex}`, issuer: mockProvider.issuer, clientId: 'arena-e2e' },
      clientSecret: 'arena-e2e-secret',
    })
  })

  test.afterEach(async ({ api }, testInfo) => {
    await api.deleteAuthProviderIfExists(getProviderId(testInfo.parallelIndex))
  })

  test('lists the provider in the system admin page', async ({ page }, testInfo) => {
    const id = getProviderId(testInfo.parallelIndex)
    await page.goto('/app/systemAdmin/authProviders/')
    await expect(page.getByTestId(`auth-provider-row-${id}`)).toContainText(`E2E SSO ${testInfo.parallelIndex}`)
  })

  test.describe('guest', () => {
    test.use({ authenticated: false })

    test('signs in an existing user with the provider', async ({ page, testUser }, testInfo) => {
      const id = getProviderId(testInfo.parallelIndex)
      mockProvider.setClaims({ sub: `e2e-${testUser.email}`, email: testUser.email, email_verified: true })

      await page.goto('/guest/login/')
      await page.getByTestId(`external-login-${id}`).click()

      await expect(page).toHaveURL(/\/app\//)
      await expect(page.locator('.app-header')).toBeVisible()
    })

    test('refuses an unknown user', async ({ page }, testInfo) => {
      const id = getProviderId(testInfo.parallelIndex)
      mockProvider.setClaims({ sub: 'e2e-unknown', email: 'unknown@e2e.openforis-arena.org', email_verified: true })

      await page.goto('/guest/login/')
      await page.getByTestId(`external-login-${id}`).click()

      await expect(page.locator('.guest-errors')).toHaveText(/There is no account with this email address/)
    })
  })

  test('shows the linked provider in the profile sign-in methods', async ({ page, testUser, browser }, testInfo) => {
    const id = getProviderId(testInfo.parallelIndex)
    mockProvider.setClaims({ sub: `e2e-${testUser.email}`, email: testUser.email, email_verified: true })
    // first sign-in with the provider (links the identity) in a separate guest context
    const guestContext = await browser.newContext()
    const guestPage = await guestContext.newPage()
    await guestPage.goto(`${testInfo.project.use.baseURL}/guest/login/`)
    await guestPage.getByTestId(`external-login-${id}`).click()
    await expect(guestPage).toHaveURL(/\/app\//)
    await guestContext.close()

    await page.goto('/app/users/user/')
    await expect(page.getByTestId(`sign-in-method-${id}`)).toContainText(testUser.email)
  })
})
