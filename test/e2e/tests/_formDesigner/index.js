import { TestId, getSelector } from '../../../../webapp/utils/testId'
import { editNodeDefDetails } from '../_nodeDefDetails'
import { getAtomicAttributeKeys, tree } from '../../mock/nodeDefs'
import { dragAndDrop } from '../utils/dragDrop'

const makeEditButtonsVisible = async ({ nodeDefName }) => {
  const wrapperSelector = getSelector(TestId.surveyForm.nodeDefWrapper(nodeDefName))
  await page.waitForSelector(wrapperSelector)
  const wrapperEl = await page.$(wrapperSelector)
  await expect(wrapperEl).not.toBeNull()
  await wrapperEl.scrollIntoViewIfNeeded()

  // move mouse inside node def wrapper to make edit buttons appear
  const boundingBox = await wrapperEl.boundingBox()
  await page.mouse.move(boundingBox.x, boundingBox.y)
  await page.mouse.move(boundingBox.x + boundingBox.width / 2, boundingBox.y + boundingBox.height / 2, { steps: 2 })
}

// ==== add
export const addNodeDef = (nodeDefParent, nodeDefChild, editDetails = true) => {
  test(`${nodeDefParent.label} -> ${nodeDefChild.label} add`, async () => {
    await makeEditButtonsVisible({ nodeDefName: nodeDefParent.name })
    await page.click(getSelector(TestId.surveyForm.nodeDefAddChildToBtn(nodeDefParent.name), 'button'))
    await Promise.all([
      page.waitForNavigation(),
      page.click(getSelector(TestId.surveyForm.nodeDefAddChildOfTypeBtn(nodeDefChild.type), 'button')),
    ])
  })

  if (editDetails) editNodeDefDetails(nodeDefChild)

  if (nodeDefChild.type === 'entity') {
    test(`Expand ${nodeDefChild.name} table`, async () => {
      // expand table by 3 columns and 4 rows
      const entitySelector = getSelector(TestId.surveyForm.nodeDefWrapper(tree.name))
      const entityEl = await page.$(entitySelector)
      const entityBBox = await entityEl.boundingBox()
      // move the mouse in several steps: the grid layout updates the item size on every mouse move
      await dragAndDrop(
        entityBBox.x + entityBBox.width - 5,
        entityBBox.y + entityBBox.height - 5,
        entityBBox.x + entityBBox.width * 3,
        entityBBox.y + entityBBox.height * 4,
        { steps: 10 }
      )
      // a missed resize would leave the table one row high (only its header visible) and break the next tests
      // (no optional chaining here: the function is serialized and evaluated in the page)
      // Timeout matches the outer test timeout below with margin for cleanup/reporting: under CI
      // load the grid layout can take well over 5s to react to the simulated drag, which was
      // making this test (and every downstream test relying on the table being expanded) flaky.
      await page.waitForFunction(
        ({ selector, heightBefore }) => {
          const el = document.querySelector(selector)
          return !!el && el.getBoundingClientRect().height > heightBefore * 2
        },
        { selector: entitySelector, heightBefore: entityBBox.height },
        { timeout: 12000 }
      )
    }, 15000)
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
    await Promise.all([page.waitForNavigation(), page.click(getSelector(TestId.surveyForm.addSubPageBtn, 'button'))])
  })

  editNodeDefDetails(nodeDefChild)
}

// ==== edit
export const editNodeDef = (formName, nodeDef, editDetails = true) => {
  test(`${nodeDef.label} edit`, async () => {
    await makeEditButtonsVisible({ nodeDefName: formName })

    const editBtnSelector = getSelector(TestId.surveyForm.nodeDefEditBtn(formName), 'button')
    await page.waitForSelector(editBtnSelector)

    await Promise.all([page.waitForNavigation(), page.click(editBtnSelector)])
  })

  if (editDetails) editNodeDefDetails(nodeDef)
}

// ==== form navigation
export const gotoFormPage = (nodeDef) => {
  test(`Goto form page ${nodeDef.name}`, async () => {
    const treeItemSelector = `${getSelector(TestId.surveyForm.pageLinkBtn(nodeDef.name))} .MuiTreeItem-label`
    await page.click(treeItemSelector)
  })
}

export const selectForm = ({ nodeDef, keyNodeDef, keyValue }) => {
  const optionLabel = `${keyNodeDef.label}: ${keyValue}`
  test(`Select form ${optionLabel}`, async () => {
    const nodeSelectSelector = getSelector(TestId.entities.form.nodeSelect, 'select')
    await page.selectOption(nodeSelectSelector, { label: optionLabel })
  })
}
