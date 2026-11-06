import { TestId } from '@webapp/utils/testId'

import { expect, test } from '../fixtures'
import { sampleRecords } from '../fixtures/seed/sampleSurveyModel'
import { getDropdown, selectDropdownItem } from '../helpers/dropdown'
import { Urls } from '../helpers/urls'

test.describe('Data Explorer query sidebar', () => {
  test.use({ sampleSurveyOptions: { records: sampleRecords } })

  test('edits the measure aggregate functions and the sort', async ({ page, sampleSurvey: _ }) => {
    await page.goto(Urls.dataExplorer)
    await selectDropdownItem({ page, dropdown: getDropdown(page, TestId.entities.entitySelector), label: 'Tree' })
    const sidebar = page.locator('.query-sidebar')
    await sidebar.getByRole('button', { name: 'Aggregate' }).click()
    await page.locator('.attribute-selector', { hasText: 'Tree id' }).click()
    await page.locator('.attribute-selector', { hasText: 'Tree decimal 1' }).click()

    // aggregate functions picked next to the measure chip; the last one cannot be removed
    const fnsButton = page.getByRole('button', { name: /^Aggregate functions of Tree decimal 1/ })
    await expect(fnsButton).toHaveText('Sum')
    await fnsButton.click()
    const sumItem = page.getByRole('menuitemcheckbox', { name: 'Sum' })
    await expect(sumItem).toHaveAttribute('aria-checked', 'true')
    await expect(sumItem).toHaveAttribute('aria-disabled', 'true')
    await page.getByRole('menuitemcheckbox', { name: 'Average' }).click()
    await page.keyboard.press('Escape')
    await expect(fnsButton).toHaveText('Sum, Average')
    // tree_dec_1 by tree id (3 records): sum 34.5, average 11.5
    const rows = page.locator('.table__data-rows .table__row')
    await expect(rows.filter({ hasText: '34.5' })).toContainText('11.5')

    // sort added from the column header, shown and toggled in the sidebar
    await expect(sidebar.getByRole('button', { name: 'Add sort' })).toBeVisible()
    await page.locator('.table__row-header .btn-sort-toggle').first().click()
    const sortItem = sidebar.locator('.query-sidebar__condition', { hasText: 'Tree id' })
    await sortItem.getByRole('button', { name: /Sort order: Ascending/ }).click()
    await expect(sortItem.getByRole('button', { name: /Sort order: Descending/ })).toBeVisible()
    await expect(rows.first()).toContainText('154.5')
    await sortItem.getByRole('button', { name: 'Remove Tree id' }).click()
    await expect(sidebar.getByRole('button', { name: 'Add sort' })).toBeVisible()
  })
})
