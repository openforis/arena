import { TestId, getSelector } from '../../../../webapp/utils/testId'

export const expectNoItems = async () => {
  // wait for loading bar to disappear and for "no items" to appear
  const noItemsSelector = getSelector(TestId.table.noItems)
  await page.waitForSelector(noItemsSelector, { timeout: 5000 })
  await expect(page).toHaveSelector(noItemsSelector)
}
