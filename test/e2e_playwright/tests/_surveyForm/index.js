import { DataTestId, getSelector } from '../../../../webapp/utils/dataTestId'
import { editNodeDefDetails } from '../_nodeDefDetails'
import { getAtomicAttributeKeys } from '../../mock/nodeDefs'

// ==== add
export const addNodeDef = (nodeDefParent, nodeDefChild, editDetails = true) => {
  test(`${nodeDefParent.label} -> ${nodeDefChild.label} add`, async () => {
    await page.click(getSelector(DataTestId.surveyForm.nodeDefAddChildBtn(nodeDefParent.name), 'button'))
    await Promise.all([page.waitForNavigation(), page.click(`text="${nodeDefChild.type}"`)])
  })

  if (editDetails) editNodeDefDetails(nodeDefChild)
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
export const editNodeDef = (formName, nodeDef) => {
  test(`${nodeDef.label} edit`, async () => {
    await Promise.all([
      page.waitForNavigation(),
      page.click(getSelector(DataTestId.surveyForm.nodeDefEditBtn(formName), 'a')),
    ])
  })

  editNodeDefDetails(nodeDef)
}

// ==== form navigation
export const gotoFormPage = (nodeDef) => {
  test(`Goto form page ${nodeDef.name}`, async () => {
    await page.click(getSelector(DataTestId.surveyForm.pageLinkBtn(nodeDef.name), 'button'))
  })
}
