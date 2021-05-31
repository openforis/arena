import { DataTestId, getSelector } from '../../../../webapp/utils/dataTestId'

export const expectNoItems = async () => {
  // wait for loading bar to disappear and for "no items" to appear
  const noItemsSelector = getSelector(DataTestId.table.noItems)
  await page.waitForSelector(noItemsSelector, { timeout: 5000 })
  await expect(page).toHaveSelector(noItemsSelector)
}
