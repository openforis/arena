import { DataTestId, getSelector } from '../../../../webapp/utils/dataTestId'
import { editNodeDefDetails } from '../_nodeDefDetails'
import { getAtomicAttributeKeys, tree } from '../../mock/nodeDefs'
import { dragAndDrop } from '../utils/dragDrop'

// ==== add
export const addNodeDef = (nodeDefParent, nodeDefChild, editDetails = true) => {
  test(`${nodeDefParent.label} -> ${nodeDefChild.label} add`, async () => {
    await page.click(getSelector(DataTestId.surveyForm.nodeDefAddChildBtn(nodeDefParent.name), 'button'))
    await Promise.all([page.waitForNavigation(), page.click(`text="${nodeDefChild.type}"`)])
  })

  if (editDetails) editNodeDefDetails(nodeDefChild)

  if (nodeDefChild.type === 'entity') {
    test(`Expand ${nodeDefChild.name} table`, async () => {
      // expand table by 3 columns and 4 rows
      const entityEl = await page.$(getSelector(tree.name))
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
    await Promise.all([
      page.waitForNavigation(),
      page.click(getSelector(DataTestId.surveyForm.nodeDefEditBtn(formName), 'a')),
    ])
  })

  if (editDetails) editNodeDefDetails(nodeDef)
}

// ==== form navigation
export const gotoFormPage = (nodeDef) => {
  test(`Goto form page ${nodeDef.name}`, async () => {
    await page.click(getSelector(DataTestId.surveyForm.pageLinkBtn(nodeDef.name), 'button'))
  })
}
