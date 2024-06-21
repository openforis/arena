import { TestId, getSelector } from '../../../../webapp/utils/testId'
import { categories } from '../../mock/categories'
import { BASE_URL } from '../../config'
import { FormUtils } from '../utils/formUtils'

const editCodeDetails = async (nodeDef) => {
  const category = categories[nodeDef.category]
  // select category
  await FormUtils.selectDropdownItem({ testId: TestId.categorySelector.dropdown, value: category.uuid })

  if (nodeDef.parent) {
    // select parent
    await FormUtils.selectDropdownItem({ testId: TestId.nodeDefDetails.nodeDefCodeParent, label: nodeDef.parent })
  } else {
    await FormUtils.expectDropdownToBeDisabled({ testId: TestId.nodeDefDetails.nodeDefCodeParent })
  }
}

const editFnTypes = {
  code: editCodeDetails,
}

export const persistNodeDefChanges = (nodeDef) =>
  test(`${nodeDef.label} persist changes`, async () => {
    // Save
    await Promise.all([
      page.waitForResponse('**/api/survey/**'),
      page.click(getSelector(TestId.nodeDefDetails.saveBtn, 'button')),
    ])
    // Back
    await Promise.all([page.waitForNavigation(), page.click(getSelector(TestId.nodeDefDetails.backBtn, 'button'))])
    await page.waitForSelector(getSelector(TestId.surveyForm.surveyForm))

    await expect(page.url()).toBe(`${BASE_URL}/app/designer/formDesigner/`)
    await expect(page).toHaveText(nodeDef.label)
  })

export const editNodeDefDetails = (nodeDef) => {
  test(`${nodeDef.label} edit details`, async () => {
    await FormUtils.fillInput(TestId.nodeDefDetails.nodeDefName, nodeDef.name)
    await FormUtils.fillInput(TestId.nodeDefDetails.nodeDefLabels(), nodeDef.label)
    if (nodeDef.key) {
      await page.click(getSelector(TestId.nodeDefDetails.nodeDefKey))
    }
    if (nodeDef.multiple) {
      await page.click(getSelector(TestId.nodeDefDetails.nodeDefMultiple))
    }
    if (nodeDef.unique) {
      // go to Validations tab
      await page.click(getSelector(TestId.tabBar.tabBarBtn(TestId.nodeDefDetails.validations), 'button'))
      // select unique
      await page.click(getSelector(TestId.nodeDefDetails.nodeDefUnique))
      // go back to Basic tab
      await page.click(getSelector(TestId.tabBar.tabBarBtn(TestId.nodeDefDetails.basic), 'button'))
    }
    const editFnType = editFnTypes[nodeDef.type]
    if (editFnType) await editFnType(nodeDef)
  })

  persistNodeDefChanges(nodeDef)
}
