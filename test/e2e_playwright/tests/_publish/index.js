import { DataTestId, getSelector } from '../../../../webapp/utils/dataTestId'
import { gotoHome } from '../_navigation'

const publish = async () => {
  await page.click(getSelector(DataTestId.header.surveyPublishBtn, 'button'))
  await page.waitForSelector(getSelector(DataTestId.modal.modal))
  await page.click(DataTestId.modal.ok)
}

export const publishWithErrors = (...errors) =>
  test('Survey Publish with errors', async () => {
    await publish()

    await page.waitForSelector(DataTestId.modal.itemError)
    await Promise.all(errors.map((error) => expect(page).toHaveText(error)))

    await page.click(DataTestId.modal.close)
  })

export const publishWithoutErrors = () => {
  test('Survey Publish', async () => {
    await publish()
    await page.click(DataTestId.modal.close)
  })

  gotoHome()

  test('Verify survey status is published', async () => {
    expect(await page.innerText(getSelector(DataTestId.dashboard.surveyStatus))).toBe('(PUBLISHED)')
  })
}
