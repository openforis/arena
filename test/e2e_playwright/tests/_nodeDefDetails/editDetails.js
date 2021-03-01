import { DataTestId, getSelector } from '../../../../webapp/utils/dataTestId'
import { categories } from '../../mock/categories'
import { BASE_URL } from '../../config'

const editCodeDetails = async (nodeDef) => {
  const category = categories[nodeDef.category]
  // select category
  await page.click(getSelector(DataTestId.dropdown.toggleBtn(DataTestId.categorySelector.category), 'button'))
  await page.click(getSelector(DataTestId.dropdown.dropDownItem(category.uuid)))

  if (nodeDef.parent) {
    // select parent
    await page.click(getSelector(DataTestId.dropdown.toggleBtn(DataTestId.nodeDefDetails.nodeDefCodeParent), 'button'))
    await page.click(`text="${nodeDef.parent}"`)
  } else {
    const codeParent = await page.$(getSelector(DataTestId.nodeDefDetails.nodeDefCodeParent, 'input'))
    await expect(await codeParent.isDisabled()).toBeTruthy()
  }
}

const editFnTypes = {
  code: editCodeDetails,
}

export const isInSurveyForm = async (nodeDef) => {
  await page.waitForSelector(getSelector(DataTestId.surveyForm.surveyForm))

  await expect(page.url()).toBe(`${BASE_URL}/app/designer/formDesigner/`)
  await expect(page).toHaveText(nodeDef.label)
}

export const persistNodeDefChanges = (nodeDef, postEdit = isInSurveyForm) =>
  test(`${nodeDef.label} persist changes`, async () => {
    // Save
    await Promise.all([
      page.waitForResponse('**/api/survey/**'),
      page.click(getSelector(DataTestId.nodeDefDetails.saveBtn, 'button')),
    ])
    // Back
    await Promise.all([page.waitForNavigation(), page.click(getSelector(DataTestId.nodeDefDetails.backBtn, 'button'))])
    if (postEdit) await postEdit(nodeDef)
  })

export const editNodeDefDetails = (nodeDef, postEdit = isInSurveyForm) => {
  test(`${nodeDef.label} edit details`, async () => {
    await page.fill(getSelector(DataTestId.nodeDefDetails.nodeDefName, 'input'), nodeDef.name)
    await page.fill(getSelector(DataTestId.nodeDefDetails.nodeDefLabels(), 'input'), nodeDef.label)
    if (nodeDef.descriptions)
      await page.fill(getSelector(DataTestId.nodeDefDetails.nodeDefDescriptions(), 'input'), nodeDef.descriptions)
    if (nodeDef.key) await page.click(getSelector(DataTestId.nodeDefDetails.nodeDefKey, 'button'))

    const editFnType = editFnTypes[nodeDef.type]
    if (editFnType) await editFnType(nodeDef)
  })

  persistNodeDefChanges(nodeDef, postEdit)
}
