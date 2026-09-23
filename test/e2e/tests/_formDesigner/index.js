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
      // The previous test (persistNodeDefChanges) just navigated back here, which briefly shows
      // the app's global route loader (Routes.js renders <Loader />, centered on the viewport -
      // see Loader.scss's .loader__boxes) on top of everything. page.waitForSelector below only
      // waits for the entity to be present/visible, not for this overlay to be gone, and the raw
      // page.mouse drag further down has none of page.click's built-in "not obscured by another
      // element" checks - confirmed in CI logs, where elementFromPoint at the drag's start
      // coordinates resolved to the loader's own div instead of the resize handle (the entity
      // happened to sit near the viewport center, right under it). Waiting for it here first
      // avoids starting the drag on top of it. It unmounts (CSSTransition unmountOnExit) rather
      // than just hiding, so waiting for it to detach is the right check, not just "hidden".
      await page.waitForSelector('.loader__boxes', { state: 'detached', timeout: 5000 })

      // expand table by 3 columns and 4 rows
      const entitySelector = getSelector(TestId.surveyForm.nodeDefWrapper(tree.name))
      await page.waitForSelector(entitySelector)
      const entityEl = await page.$(entitySelector)
      await entityEl.scrollIntoViewIfNeeded()
      const entityBBox = await entityEl.boundingBox()

      // The resize handle belongs to the react-grid-item wrapping this node def, not to the node
      // def wrapper itself: the wrapper's own bounding box can be narrower than its grid-item
      // parent right after this item mounts (its content briefly reflows independently of the grid
      // cell width react-grid-layout already assigned it), so computing the drag's start point as
      // an offset from the wrapper's box - like this test used to - can target a point short of
      // where the handle actually is. Dragging from the handle's own rect sidesteps that mismatch
      // entirely. A missed drag leaves the table one row high (only its header visible) and breaks
      // every following test that expects it expanded, which is what made this flaky in CI.
      const handleBox = await page.evaluate((selector) => {
        const el = document.querySelector(selector)
        const gridItem = el?.closest('.react-grid-item')
        const handle = gridItem?.querySelector('.react-resizable-handle')
        if (!handle) return null
        const rect = handle.getBoundingClientRect()
        return { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
      }, entitySelector)
      if (!handleBox) throw new Error(`Could not find .react-resizable-handle for ${entitySelector}`)

      // move the mouse in several steps: the grid layout updates the item size on every mouse move
      await dragAndDrop(
        handleBox.x + handleBox.width / 2,
        handleBox.y + handleBox.height / 2,
        entityBBox.x + entityBBox.width * 3,
        entityBBox.y + entityBBox.height * 4,
        { steps: 10 }
      )
      // a missed resize would leave the table one row high (only its header visible) and break the next tests
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
