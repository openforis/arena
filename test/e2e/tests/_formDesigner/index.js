import { DataTestId, getSelector } from '../../../../webapp/utils/dataTestId'
import { editNodeDefDetails } from '../_nodeDefDetails'
import { getAtomicAttributeKeys, tree } from '../../mock/nodeDefs'
import { dragAndDrop } from '../utils/dragDrop'

const makeEditButtonsVisible = async ({ nodeDefName }) => {
  const wrapperSelector = getSelector(DataTestId.surveyForm.nodeDefWrapper(nodeDefName))
  await page.waitForSelector(wrapperSelector)
  const wrapperEl = await page.$(wrapperSelector)
  await expect(wrapperEl).not.toBeNull()

  // move mouse inside node def wrapper to make edit buttons appear
  const boundingBox = await wrapperEl.boundingBox()
  await page.mouse.move(boundingBox.x, boundingBox.y)
  await page.mouse.move(boundingBox.x + boundingBox.width / 2, boundingBox.y + boundingBox.height / 2, { steps: 2 })
}

// ==== add
export const addNodeDef = (nodeDefParent, nodeDefChild, editDetails = true) => {
  test(`${nodeDefParent.label} -> ${nodeDefChild.label} add`, async () => {
    await makeEditButtonsVisible({ nodeDefName: nodeDefParent.name })
    await page.click(getSelector(DataTestId.surveyForm.nodeDefAddChildBtn(nodeDefParent.name), 'button'))
    await Promise.all([page.waitForNavigation(), page.click(`text="${nodeDefChild.type}"`)])
  })

  if (editDetails) editNodeDefDetails(nodeDefChild)

  if (nodeDefChild.type === 'entity') {
    test(`Expand ${nodeDefChild.name} table`, async () => {
      // expand table by 3 columns and 4 rows
      const entityEl = await page.$(getSelector(DataTestId.surveyForm.nodeDefWrapper(tree.name)))
      const entityBBox = await entityEl.boundingBox()
      await dragAndDrop(
        entityBBox.x + entityBBox.width - 5,
        entityBBox.y + entityBBox.height - 5,
        entityBBox.x + entityBBox.width * 3,
        entityBBox.y + entityBBox.height * 4
      )
    })
  }
}

export const addNodeDefAtomicChildren = (nodeDefParent) => {
  getAtomicAttributeKeys(nodeDefParent).forEach((key) => {
    const nodeDefChild = nodeDefParent.children[key]
    addNodeDef(nodeDefParent, nodeDefChild)
  })
}

export const addNodeDefSubPage = (nodeDefParent, nodeDefChild) => {
  test(`${nodeDefParent.label} -> ${nodeDefChild.label} add`, async () => {
    await Promise.all([
      page.waitForNavigation(),
      page.click(getSelector(DataTestId.surveyForm.addSubPageBtn, 'button')),
    ])
  })

  editNodeDefDetails(nodeDefChild)
}

// ==== edit
export const editNodeDef = (formName, nodeDef, editDetails = true) => {
  test(`${nodeDef.label} edit`, async () => {
    await makeEditButtonsVisible({ nodeDefName: formName })

    const editBtnSelector = getSelector(DataTestId.surveyForm.nodeDefEditBtn(formName), 'a')
    await page.waitForSelector(editBtnSelector)

    await Promise.all([page.waitForNavigation(), page.click(editBtnSelector)])
  })

  if (editDetails) editNodeDefDetails(nodeDef)
}

// ==== form navigation
export const gotoFormPage = (nodeDef) => {
  test(`Goto form page ${nodeDef.name}`, async () => {
    await page.click(getSelector(DataTestId.surveyForm.pageLinkBtn(nodeDef.name), 'button'))
  })
}

export const selectForm = (nodeDef, formIndex) => {
  test(`Select form ${nodeDef.label} - ${formIndex}`, async () => {
    await page.click(getSelector(DataTestId.entities.form.nodeSelect, 'select'))
    const optionSelector = getSelector(DataTestId.entities.form.nodeSelectOption(formIndex), 'option')
    await page.waitForSelector(optionSelector)
    await page.click(optionSelector)
  })
}
