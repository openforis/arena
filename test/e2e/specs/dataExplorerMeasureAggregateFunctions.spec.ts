import { TestId } from '@webapp/utils/testId'

import { expect, test } from '../fixtures'
import { sampleRecords } from '../fixtures/seed/sampleSurveyModel'
import { getDropdown, selectDropdownItem } from '../helpers/dropdown'
import { Urls } from '../helpers/urls'

test.describe('Data Explorer measure aggregate functions', () => {
  test.use({ sampleSurveyOptions: { records: sampleRecords } })

  test('picks the aggregate functions from the measure chip menu', async ({ page, sampleSurvey: _ }) => {
    await page.goto(Urls.dataExplorer)
    await selectDropdownItem({ page, dropdown: getDropdown(page, TestId.entities.entitySelector), label: 'Tree' })
    await page.locator('.query-sidebar').getByRole('button', { name: 'Aggregate' }).click()
    await page.locator('.attribute-selector', { hasText: 'Tree id' }).click()
    await page.locator('.attribute-selector', { hasText: 'Tree decimal 1' }).click()

    const fnsButton = page.getByRole('button', { name: 'Aggregate functions of Tree decimal 1: Sum', exact: true })
    await fnsButton.click()
    // the last selected function cannot be removed
    const sumItem = page.getByRole('menuitemcheckbox', { name: 'Sum' })
    await expect(sumItem).toHaveAttribute('aria-checked', 'true')
    await expect(sumItem).toHaveAttribute('aria-disabled', 'true')
    await page.getByRole('menuitemcheckbox', { name: 'Average' }).click()

    // tree_dec_1 by tree id (3 records): sum 34.5, average 11.5
    const rows = page.locator('.table__data-rows .table__row')
    await expect(rows.filter({ hasText: '34.5' })).toContainText('11.5')
    // after the data reload the open menu is still anchored below the button
    // (CSS locators: the open menu hides the rest of the page from role queries)
    const fnsButtonBox = await page.locator('.data-query__aggregate-fns-btn').boundingBox()
    const menuBox = await page.locator('.MuiMenu-paper').boundingBox()
    expect(Math.abs((menuBox?.x ?? 0) - (fnsButtonBox?.x ?? 0))).toBeLessThan(50)
    expect(menuBox?.y ?? 0).toBeGreaterThan(fnsButtonBox?.y ?? 0)

    await page.keyboard.press('Escape')
    await expect(
      page.getByRole('button', { name: 'Aggregate functions of Tree decimal 1: Sum, Average', exact: true })
    ).toBeVisible()
  })
})
