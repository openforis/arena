import { TestId } from '@webapp/utils/testId'

import { expect, test } from '../fixtures'
import { Urls } from '../helpers/urls'

// the server must run with the mock provider (see test/e2e/README.md)
const aiMock = process.env.E2E_AI_MOCK === 'true'

test.describe('What AI can see (access levels)', () => {
  test.skip(!aiMock, 'needs a server started with AI_MOCK_PROVIDER_ENABLED=true and AI_DEFAULT_PROVIDER=mock')

  // the worker user is shared with the other specs
  test.afterEach(async ({ api }) => {
    await api.disableAiFeatures()
  })

  test('an old settings save shows as the matching level', async ({ page, api }) => {
    await api.enableAiFeatures()
    await page.goto(Urls.userProfile)
    await expect(page.getByTestId(TestId.ai.accessLevel(3))).toHaveAttribute('aria-checked', 'true')
    await expect(page.getByTestId(TestId.ai.accessCustomize)).toContainText('10 of 10')
  })

  test('choosing Help only saves level 1 and turns on the Help assistant only', async ({ page, api }) => {
    await api.disableAiFeatures()
    await page.goto(Urls.userProfile)
    await expect(page.getByTestId(TestId.ai.accessLevel(0))).toHaveAttribute('aria-checked', 'true')
    await page.getByTestId(TestId.ai.accessLevel(1)).click()
    await page.locator('button.btn-save').click()
    await expect
      .poll(() => api.getAiSettings())
      .toMatchObject({ accessLevel: 1, featuresEnabled: true, featureToggles: { chat: true, expressions: false } })
  })

  test('the arrow keys change the level, and Off turns AI off', async ({ page, api }) => {
    await api.enableAiFeatures()
    await page.goto(Urls.userProfile)
    await page.getByTestId(TestId.ai.accessLevel(3)).focus()
    await page.keyboard.press('ArrowLeft')
    await expect(page.getByTestId(TestId.ai.accessLevel(2))).toHaveAttribute('aria-checked', 'true')
    await expect(page.getByTestId(TestId.ai.accessLevel(2))).toBeFocused()
    await page.getByTestId(TestId.ai.accessLevel(0)).click()
    await expect(page.getByTestId(TestId.ai.accessCustomize)).toHaveCount(0)
    await page.locator('button.btn-save').click()
    await expect.poll(() => api.getAiSettings()).toMatchObject({ accessLevel: 0, featuresEnabled: false })
  })

  test('a feature above the level is disabled under Customize', async ({ page, api }) => {
    await api.disableAiFeatures()
    await page.goto(Urls.userProfile)
    await page.getByTestId(TestId.ai.accessLevel(2)).click()
    await page.getByTestId(TestId.ai.accessCustomize).click()
    await expect(page.getByTestId(TestId.ai.featureToggle('expressions'))).toBeEnabled()
    await expect(page.getByTestId(TestId.ai.featureToggle('assistantCleaning'))).toBeDisabled()
  })
})
