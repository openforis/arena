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
})
