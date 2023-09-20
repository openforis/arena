import { TestId, getSelector } from '../../../../webapp/utils/testId'
import { gotoHome } from '../_navigation'

const publish = async () => {
  await page.click(getSelector(TestId.header.surveyPublishBtn, 'button'))
  await page.waitForSelector(getSelector(TestId.modal.modal))
  await page.click(TestId.modal.ok)
}

export const publishWithErrors = (...errors) =>
  test('Survey Publish with errors', async () => {
    await publish()

    await page.waitForSelector(TestId.jobMonitor.errorsContainer)
    await Promise.all(errors.map((error) => expect(page).toHaveText(error)))

    await page.click(TestId.modal.close)
  })

export const verifySurveyPublished = () =>
  test('Verify survey status is published', async () => {
    expect(await page.innerText(getSelector(TestId.dashboard.surveyStatus))).toBe('(PUBLISHED)')
  })

export const publishWithoutErrors = ({ inHomePage = false } = {}) => {
  test('Survey Publish', async () => {
    await publish()
    await page.waitForSelector(getSelector(TestId.modal.modal))
    await page.click(TestId.modal.close)
  })

  if (!inHomePage) {
    gotoHome()
  }

  verifySurveyPublished()
}
