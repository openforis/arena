import { TestId, getSelector } from '../../../../webapp/utils/testId'
import { categories } from '../../mock/categories'
import { BASE_URL } from '../../config'

const editCodeDetails = async (nodeDef) => {
  const category = categories[nodeDef.category]
  // select category
  await page.click(getSelector(TestId.dropdown.toggleBtn(TestId.categorySelector.category)))
  await page.click(getSelector(TestId.dropdown.dropDownItem(category.uuid)))

  if (nodeDef.parent) {
    // select parent
    await page.click(getSelector(TestId.dropdown.toggleBtn(TestId.nodeDefDetails.nodeDefCodeParent)))
    await page.click(`text="${nodeDef.parent}"`)
  } else {
    const codeParent = await page.$(getSelector(TestId.nodeDefDetails.nodeDefCodeParent, 'input'))
    await expect(await codeParent.isDisabled()).toBeTruthy()
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
    await page.fill(getSelector(TestId.nodeDefDetails.nodeDefName, 'input'), nodeDef.name)
    await page.fill(getSelector(TestId.nodeDefDetails.nodeDefLabels(), 'input'), nodeDef.label)
    if (nodeDef.key) {
      await page.click(getSelector(TestId.nodeDefDetails.nodeDefKey, 'button'))
    }
    if (nodeDef.multiple) {
      await page.click(getSelector(TestId.nodeDefDetails.nodeDefMultiple, 'button'))
    }
    if (nodeDef.unique) {
      // go to Validations tab
      await page.click(getSelector(TestId.tabBar.tabBarBtn(TestId.nodeDefDetails.validations), 'button'))
      // select unique
      await page.click(getSelector(TestId.nodeDefDetails.nodeDefUnique, 'button'))
      // go back to Basic tab
      await page.click(getSelector(TestId.tabBar.tabBarBtn(TestId.nodeDefDetails.basic), 'button'))
    }
    const editFnType = editFnTypes[nodeDef.type]
    if (editFnType) await editFnType(nodeDef)
  })

  persistNodeDefChanges(nodeDef)
}
