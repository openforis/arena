import { TestId } from '@webapp/utils/testId'

import { expect, test } from '../fixtures'
import { openAssistantPanel } from '../helpers/assistantPanel'
import { Urls } from '../helpers/urls'

// the server must run with the mock provider (see test/e2e/README.md)
const aiMock = process.env.E2E_AI_MOCK === 'true'

test.describe('Profile menu over the assistant panel (mock provider)', () => {
  test.skip(!aiMock, 'needs a server started with AI_MOCK_PROVIDER_ENABLED=true and AI_DEFAULT_PROVIDER=mock')

  test.beforeEach(async ({ api }) => {
    await api.enableAiFeatures()
  })

  // the worker user is shared with the other specs
  test.afterEach(async ({ api }) => {
    await api.disableAiFeatures()
  })

  test('the profile menu opens on top of the open panel and its link is clickable', async ({ page }) => {
    await page.goto(Urls.home)
    await openAssistantPanel(page)
    await page.getByTestId(TestId.header.userBtn).click()
    const profileLink = page.getByTestId(TestId.header.userProfileBtn)
    await expect(profileLink).toBeVisible()
    // behind the panel, the click would land on the panel (Playwright reports the element intercepting it)
    await profileLink.click()
    await expect(page).toHaveURL(/\/app\/users\/user\//)
  })
})
