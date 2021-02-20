import { DataTestId } from '../../../../webapp/utils/dataTestId'
import { getAtomicAttributeKeys } from '../../mock/nodeDefs'

// const editCode = async (nodeDef) => {
//   await page.click(DataTestId.nodeDefDetails.save)
//   await expect(page).toHaveSelector(DataTestId.notification.error)
//   // await page.fill(DataTestId.nodeDefDetails.nodeDefCategory, nodeDef.category.substring(0, 3))
//
//   // await page.click(`div[id="${DataTestId.nodeDefDetails.nodeDefCategorySelector.substring(1)}"]/div/button`)
//   await page.click(`button[data-testid="dropdown-toggle-btn"]`)
//
//   if (await page.$('div[role="button"]')) {
//     await page.click('div[role="button"]')
//   } else {
//     await page.click(DataTestId.nodeDefDetails.nodeDefCategoryAdd)
//     await expect(page).toHaveText('Category name')
//
//     const category = categories[nodeDef.category]
//     await page.fill(DataTestId.categoryDetails.categoryName, category.name)
//     await page.click(DataTestId.panelRight.close)
//   }
// }

export const editNodeDef = async (nodeDef) => {
  await page.fill(DataTestId.nodeDefDetails.nodeDefName, nodeDef.name)
  await page.fill(DataTestId.nodeDefDetails.nodeDefLabels(), nodeDef.label)
  if (nodeDef.key) await page.click(DataTestId.nodeDefDetails.nodeDefKey)

  // Click text="Save"
  await Promise.all([page.waitForResponse('**/api/survey/**'), page.click(DataTestId.nodeDefDetails.save)])
  // Click text="Back"
  await Promise.all([page.waitForNavigation(), page.click(DataTestId.nodeDefDetails.back)])
  await page.waitForSelector(DataTestId.surveyForm.surveyForm)

  await expect(page.url()).toBe('http://localhost:9090/app/designer/formDesigner/')
  await expect(page).toHaveText(nodeDef.label)
}

export const editAtomicChildren = (nodeDef) =>
  test.each(getAtomicAttributeKeys(nodeDef))(`${nodeDef.label} child %o edit`, async (key) => {
    const child = nodeDef.children[key]
    await page.click(DataTestId.surveyForm.nodeDefAddChildBtn(nodeDef.name))
    await Promise.all([page.waitForNavigation(), page.click(`text="${child.type}"`)])
    await editNodeDef(child)
  })
