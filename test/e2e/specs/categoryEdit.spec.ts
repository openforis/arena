import fs from 'node:fs'

import { Page } from '@playwright/test'

import { TestId } from '@webapp/utils/testId'

import { expect, test } from '../fixtures'
import { category, categoryItems, SampleCategoryItem } from '../fixtures/seed/sampleSurveyModel'
import { expectDropdownValue, getDropdown, selectDropdownItem } from '../helpers/dropdown'
import { FormDesigner } from '../helpers/formDesigner'
import { publishSurvey } from '../helpers/publish'
import { exportSurvey, verifySampleCategories } from '../helpers/surveyExport'

const input = (page: Page, testId: string) => page.locator(`input[data-testid="${testId}"]`)

/**
 * Fills the specified category editor field and waits for the change to be saved
 * (changes are saved with a debounce: editing another field of the same item or closing the editor
 * before the change is saved would lose it).
 * @param {Page} page - The page.
 * @param {string} testId - Input field test id.
 * @param {string} value - Value to fill.
 * @returns {Promise<void>} - Resolves when the change has been saved.
 */
const fillAndWait = async (page: Page, testId: string, value: string): Promise<void> => {
  await Promise.all([
    page.waitForResponse((response) => /\/categories\//.test(response.url()) && response.request().method() === 'PUT'),
    input(page, testId).fill(value),
  ])
}

/**
 * Adds the specified items (and their descendants) to the category being edited.
 * @param {Page} page - The page.
 * @param {SampleCategoryItem[]} items - Items to add.
 * @param {number} levelIdx - Index of the level of the items.
 * @returns {Promise<void>} - Resolves when all the items have been added.
 */
const addItems = async (page: Page, items: SampleCategoryItem[], levelIdx = 0): Promise<void> => {
  for (const [itemIdx, item] of items.entries()) {
    await page.getByTestId(TestId.categoryDetails.levelAddItemBtn(levelIdx)).click()
    // code and label filled one right after the other: both changes must be saved
    const propSaved = (key: string) =>
      page.waitForResponse(
        (response) =>
          response.request().method() === 'PUT' &&
          /\/items\//.test(response.url()) &&
          (response.request().postDataJSON()?.key ?? '') === key
      )
    const codeAndLabelSaved = Promise.all([propSaved('code'), propSaved('labels')])
    await input(page, TestId.categoryDetails.itemCode(levelIdx, itemIdx)).fill(item.code)
    await input(page, TestId.categoryDetails.itemLabel(levelIdx, itemIdx)()).fill(item.label)
    await codeAndLabelSaved
    await page.getByTestId(TestId.categoryDetails.itemCloseBtn(levelIdx, itemIdx)).click()
  }
  // select every item and add its children in the next level
  for (const [itemIdx, item] of items.entries()) {
    if (item.children.length === 0) continue
    await page.getByTestId(TestId.categoryDetails.item(levelIdx, itemIdx)).click()
    await addItems(page, item.children, levelIdx + 1)
  }
}

const selectCategoryAndParentCode = async (
  page: Page,
  { categoryName, parentCode }: { categoryName: string; parentCode?: string }
) => {
  await selectDropdownItem({
    page,
    dropdown: getDropdown(page, TestId.categorySelector.dropdown),
    label: categoryName,
  })
  const parentCodeDropdown = getDropdown(page, TestId.nodeDefDetails.nodeDefCodeParent)
  if (parentCode) {
    await selectDropdownItem({ page, dropdown: parentCodeDropdown, label: parentCode })
    await expectDropdownValue(parentCodeDropdown, parentCode)
  } else {
    await expect(parentCodeDropdown).toHaveClass(/dropdown--is-disabled/)
  }
}

test.describe('Category edit', () => {
  // long UI flow (many node defs edited and saved one by one)
  test.slow()

  test('creates a hierarchical category from a code attribute and uses it in dependent codes', async ({
    page,
    survey: _,
  }, testInfo) => {
    const designer = new FormDesigner(page)
    await designer.goto()

    // root entity with a key attribute (required to publish the survey)
    await designer.edit('root_entity')
    await designer.fillDetails({ name: 'cluster', label: 'Cluster' })
    await designer.saveAndBack('Cluster')
    await designer.addChildWithDetails('cluster', 'integer', { name: 'cluster_id', label: 'Cluster id', key: true })

    await designer.addChild('cluster', 'code')
    await designer.fillDetails({ name: 'cluster_country', label: 'Cluster country' })

    // create a new category from the code attribute details
    await page.getByTestId(TestId.categorySelector.addCategoryBtn).click()
    await fillAndWait(page, TestId.categoryDetails.categoryName, category.name)

    // the first level is created with the category
    for (let levelIdx = 1; levelIdx < category.levels.length; levelIdx += 1) {
      await page.getByTestId(TestId.categoryDetails.addLevelBtn).click()
    }
    for (const levelIdx of category.levels.keys()) {
      await expect(page.getByTestId(TestId.categoryDetails.level(levelIdx))).toBeVisible()
    }
    for (const [levelIdx, level] of category.levels.entries()) {
      await fillAndWait(page, TestId.categoryDetails.levelName(levelIdx), level.name)
    }

    await page.getByTestId(TestId.categoryDetails.levelErrorBadge(0)).hover()
    await expect(page.getByText('Define at least one item').first()).toBeVisible()

    await addItems(page, categoryItems)

    // export the category
    await page.getByTestId(TestId.categoryDetails.exportBtn).click()
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Export to CSV' }).click(),
    ])
    const exportPath = testInfo.outputPath(`category-${category.name}-export.zip`)
    await download.saveAs(exportPath)
    expect(fs.statSync(exportPath).size).toBeGreaterThan(0)

    // back to the code attribute details
    await page.getByTestId(TestId.panelRight.closeBtn).click()
    await expect(page.getByText('Parent Code')).toBeVisible()

    await selectCategoryAndParentCode(page, { categoryName: category.name })
    await designer.saveAndBack('Cluster country')

    // dependent code attributes
    await designer.addChild('cluster', 'code')
    await designer.fillDetails({ name: 'cluster_region', label: 'Cluster region' })
    await selectCategoryAndParentCode(page, { categoryName: category.name, parentCode: 'cluster_country' })
    await designer.saveAndBack('Cluster region')

    await designer.addChild('cluster', 'code')
    await designer.fillDetails({ name: 'cluster_province', label: 'Cluster province' })
    await selectCategoryAndParentCode(page, { categoryName: category.name, parentCode: 'cluster_region' })
    await designer.saveAndBack('Cluster province')

    await publishSurvey(page)

    const surveyExport = await exportSurvey(page, testInfo, { withData: false })
    verifySampleCategories(surveyExport)
    const [country, region, province] = ['cluster_country', 'cluster_region', 'cluster_province'].map((name) =>
      surveyExport.nodeDefByName(name)
    )
    expect(region.props.parentCodeDefUuid).toBe(country.uuid)
    expect(province.props.parentCodeDefUuid).toBe(region.uuid)
  })
})
