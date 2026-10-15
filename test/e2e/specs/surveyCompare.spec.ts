import * as Survey from '@core/survey/survey'
import * as User from '@core/user/user'
import * as UserManager from '@server/modules/user/manager/userManager'
import { TestId } from '@webapp/utils/testId'

import { expect, generateSurveyName, test } from '../fixtures'
import { insertSampleSurvey } from '../fixtures/seed/sampleSurvey'
import { getDropdown, selectDropdownItem } from '../helpers/dropdown'
import { Urls } from '../helpers/urls'

// the current survey has no expressions: the survey used as source adds them
test.use({ sampleSurveyOptions: { withExpressions: false } })

const shortFingerprintRegExp = /^[0-9a-f]{12}$/

test.describe('Survey compare', () => {
  let sourceSurveyId: number | null = null

  test.afterEach(async ({ api }) => {
    if (sourceSurveyId && process.env.E2E_KEEP_DATA !== 'true') await api.deleteSurveyIfExists(sourceSurveyId)
    sourceSurveyId = null
  })

  test('compares with another survey, shows the fingerprints and applies the changes', async ({
    page,
    sampleSurvey,
    testUser,
  }, testInfo) => {
    const sourceName = generateSurveyName(testInfo.parallelIndex)
    sourceSurveyId = await insertSampleSurvey({ userEmail: testUser.email, name: sourceName, label: 'Compare source' })
    // inserting a survey makes it the current one: the sample survey is set back as current survey
    const user = await UserManager.fetchUserByEmail(testUser.email)
    await UserManager.updateUserPrefs(User.assocPrefSurveyCurrentAndCycle(sampleSurvey.id, Survey.cycleOneKey)(user))

    await page.goto(Urls.dashboard)
    await expect(page.getByTestId(TestId.dashboard.surveyName)).toHaveText(sampleSurvey.name)
    await page.getByTestId(TestId.dashboard.advancedFunctionsBtn).click()
    await page.getByTestId(TestId.dashboard.surveyCompareBtn).click()

    // fingerprint of this survey, before comparing
    const fingerprint = page.getByTestId(TestId.surveyCompare.fingerprint('structural'))
    await expect(fingerprint).toHaveText(shortFingerprintRegExp)
    const fingerprintBefore = await fingerprint.textContent()

    await selectDropdownItem({
      page,
      dropdown: getDropdown(page, TestId.surveyCompare.sourceSurveyDropdown),
      label: sourceName,
    })
    const summary = page.getByTestId(TestId.surveyCompare.summary)
    await expect(summary).toContainText('Node definitions', { timeout: 30_000 })
    await expect(page.getByText(`Compared survey: ${sourceName}`)).toBeVisible()
    const sourceFingerprint = page.getByTestId(TestId.surveyCompare.sourceFingerprint('structural'))
    await expect(sourceFingerprint).toHaveText(shortFingerprintRegExp)
    await expect(sourceFingerprint).not.toHaveText(fingerprintBefore!)

    const applyBtn = page.getByTestId(TestId.surveyCompare.applyBtn)
    await expect(applyBtn).toBeEnabled()
    await applyBtn.click()
    await page.getByTestId(TestId.modal.modal).getByRole('button', { name: 'Ok', exact: true }).click()

    // the comparison is computed again after applying the changes: same structure, different ids
    await expect(summary).toHaveText('The surveys are identical', { timeout: 30_000 })
    await expect(fingerprint).toHaveText((await sourceFingerprint.textContent())!)
    await expect(page.getByTestId(TestId.surveyCompare.sourceFingerprint('strict'))).not.toHaveText(
      (await page.getByTestId(TestId.surveyCompare.fingerprint('strict')).textContent())!
    )
  })
})
