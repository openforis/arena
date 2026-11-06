import { TestId } from '@webapp/utils/testId'

import { expect, test } from '../fixtures'
import { sampleRecords } from '../fixtures/seed/sampleSurveyModel'
import { getDropdown, selectDropdownItem } from '../helpers/dropdown'
import { Urls } from '../helpers/urls'

test.describe('Data Explorer aggregate totals', () => {
  test.use({ sampleSurveyOptions: { records: sampleRecords } })

  test('shows the total and the row percentage of the measure', async ({ page, sampleSurvey: _ }) => {
    await page.goto(Urls.dataExplorer)
    await selectDropdownItem({ page, dropdown: getDropdown(page, TestId.entities.entitySelector), label: 'Tree' })
    await page.getByRole('button', { name: 'Aggregate' }).click()
    await page.locator('.attribute-selector', { hasText: 'Tree id' }).click()
    await page.locator('.attribute-selector', { hasText: 'Tree decimal 1' }).click()

    const totalsCheckbox = page.getByText('Show total and percentage')
    await totalsCheckbox.click()

    // tree_dec_1 sum by tree id (3 records): 34.5, 64.5, 94.5, 124.5, 154.5
    const rows = page.locator('.table__data-rows .table__row')
    await expect(rows.filter({ hasText: '34.5' })).toContainText('7.3 %')
    await expect(rows.filter({ hasText: '154.5' })).toContainText('32.7 %')
    const totalRow = page.locator('.table__row--total')
    await expect(totalRow).toContainText('Total')
    await expect(totalRow).toContainText('472.5')
    await expect(totalRow).toContainText('100 %')

    // available only with a single measure
    await page.locator('.attribute-selector', { hasText: 'Tree decimal 2' }).click()
    await expect(totalsCheckbox).toBeHidden()
    await expect(totalRow).toBeHidden()
  })
})
