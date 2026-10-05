import { TestId } from '@webapp/utils/testId'

import { expect, test } from '../fixtures'
import { sampleRecords } from '../fixtures/seed/sampleSurveyModel'
import { Urls } from '../helpers/urls'

test.describe('Dashboard (upgraded)', () => {
  test.use({ sampleSurveyOptions: { records: sampleRecords } })

  test('shows the KPI cards and the period selector without the legacy tabs', async ({ page, sampleSurvey: _ }) => {
    await page.goto(Urls.dashboard)

    await expect(page.getByTestId(TestId.dashboard.kpiRecords)).toBeVisible()
    await expect(page.getByTestId(TestId.dashboard.kpiContributors)).toBeVisible()
    await expect(page.getByTestId(TestId.dashboard.periodSelector)).toBeVisible()
    await expect(page.getByTestId(TestId.dashboard.trendSection)).toBeVisible()

    await expect(page.getByRole('tab', { name: /records by user/i })).toHaveCount(0)
  })

  // the sample survey has no geo attribute: the map section must not be rendered
  test('does not render the map section for a survey without geo attributes', async ({ page, sampleSurvey: _ }) => {
    await page.goto(Urls.dashboard)

    await expect(page.getByTestId(TestId.dashboard.kpiRecords)).toBeVisible()
    await expect(page.getByTestId(TestId.dashboard.mapSection)).toHaveCount(0)
  })

  test('fetches the activity log only when its section is expanded', async ({ page, sampleSurvey: _ }) => {
    const activityLogRequests: string[] = []
    page.on('request', (request) => {
      if (/\/activity-log(\?|$)/.test(request.url())) activityLogRequests.push(request.url())
    })
    await page.goto(Urls.dashboard)

    const toggle = page.getByTestId(TestId.dashboard.activityToggle)
    await toggle.scrollIntoViewIfNeeded()
    await expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await expect(page.locator('.recent-activity')).toHaveCount(0)
    expect(activityLogRequests).toHaveLength(0)

    const responsePromise = page.waitForResponse((response) => /\/activity-log(\?|$)/.test(response.url()))
    await toggle.click()
    await responsePromise
    await expect(toggle).toHaveAttribute('aria-expanded', 'true')
    await expect(page.locator('.recent-activity')).toBeVisible()
  })
})
