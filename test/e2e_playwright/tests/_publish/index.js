import { DataTestId } from '../../../../webapp/utils/dataTestId'

export const publishWithErrors = (...errors) =>
  test('Survey Publish with errors', async () => {
    await page.click(DataTestId.header.publishBtn)
    await page.waitForSelector(DataTestId.modal.modal)
    await page.click(DataTestId.modal.ok)

    await page.waitForSelector(DataTestId.modal.itemError)

    await Promise.all(errors.map((error) => expect(page).toHaveText(error)))

    await page.click(DataTestId.modal.close)
  })

export const publishWithoutErrors = () =>
  test('Survey Publish without errors', async () => {
    await page.click(DataTestId.header.publishBtn)
    await page.waitForSelector(DataTestId.modal.modal)
    await page.click(DataTestId.modal.ok)
    await page.click(DataTestId.modal.close)
    await page.click(DataTestId.sidebar.home)
    await expect(page).toHaveText('PUBLISHED')
  })
