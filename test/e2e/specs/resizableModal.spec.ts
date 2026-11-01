import { Locator, Page } from '@playwright/test'

import { TestId } from '@webapp/utils/testId'

import { expect, test } from '../fixtures'
import { sampleRecords } from '../fixtures/seed/sampleSurveyModel'
import { Urls } from '../helpers/urls'

const dragBy = async (page: Page, handle: Locator, dx: number, dy: number) => {
  const box = await handle.boundingBox()
  const x = box!.x + box!.width / 2
  const y = box!.y + box!.height / 2
  await page.mouse.move(x, y)
  await page.mouse.down()
  await page.mouse.move(x + dx, y + dy, { steps: 5 })
  await page.mouse.up()
}

test.describe('Resizable modal', () => {
  test.use({ sampleSurveyOptions: { records: sampleRecords } })

  test('can be moved, resized and closed', async ({ page, sampleSurvey: _ }) => {
    await page.goto(Urls.records)
    const rows = page.getByTestId(TestId.table.rows(TestId.records.tableModule)).locator(':scope > div')
    await rows.nth(0).click()
    await rows.nth(1).click()
    await page.getByRole('button', { name: 'Merge' }).click()
    await page.getByTestId(TestId.modal.modal).getByRole('button', { name: 'Ok' }).click()

    const modal = page.locator('.flexible-modal')
    await expect(modal).toBeVisible()
    const initialBox = (await modal.boundingBox())!

    await dragBy(page, modal.locator('.flexible-modal-drag-area'), 40, 30)
    const movedBox = (await modal.boundingBox())!
    expect(movedBox.x).toBeCloseTo(initialBox.x + 40, 0)
    expect(movedBox.y).toBeCloseTo(initialBox.y + 30, 0)
    expect(movedBox.width).toBeCloseTo(initialBox.width, 0)

    await dragBy(page, modal.locator('.flexible-modal-resizer'), -100, -50)
    const resizedBox = (await modal.boundingBox())!
    expect(resizedBox.width).toBeCloseTo(movedBox.width - 100, 0)
    expect(resizedBox.height).toBeCloseTo(movedBox.height - 50, 0)
    expect(resizedBox.x).toBeCloseTo(movedBox.x, 0)

    await page.keyboard.press('Escape')
    await expect(modal).toHaveCount(0)
  })
})
