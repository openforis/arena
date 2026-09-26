import { Locator, Page } from '@playwright/test'

import { TestId } from '@webapp/utils/testId'

import { expect, test } from '../fixtures'
import { FormDesigner } from '../helpers/formDesigner'

type Box = { x: number; y: number; width: number; height: number }

// boxes are read without scrolling: the viewport is tall enough to show the whole form (see test.use below)
const boxOf = async (locator: Locator): Promise<Box> => (await locator.boundingBox())!

/**
 * Drags an item of the form grid layout (react-grid-layout) with the mouse.
 * @param {Page} page - The page.
 * @param {object} from - Start point.
 * @param {object} to - End point.
 * @returns {Promise<void>} - Resolves when the item has been dropped.
 */
const dragWithMouse = async (page: Page, from: { x: number; y: number }, to: { x: number; y: number }) => {
  await page.mouse.move(from.x, from.y)
  await page.mouse.down()
  await page.mouse.move(to.x, to.y, { steps: 10 })
  // a last small move: the grid layout updates the placeholder position on mouse move, before the drop
  await page.mouse.move(to.x + 1, to.y + 1)
  await page.mouse.up()
}

const nodeDefWrapper = (page: Page, name: string) => page.getByTestId(TestId.surveyForm.nodeDefWrapper(name)).first()

/**
 * Waits for the grid items to stop moving (react-grid-layout animates the items to their new position).
 * @param {Page} page - The page.
 * @returns {Promise<void>} - Resolves when the layout is stable.
 */
const waitForLayoutStable = async (page: Page) => {
  const readBoxes = () =>
    page.locator('.react-grid-item').evaluateAll((els) => els.map((el) => JSON.stringify(el.getBoundingClientRect())))
  let prev = await readBoxes()
  await expect
    .poll(
      async () => {
        const current = await readBoxes()
        const stable = JSON.stringify(current) === JSON.stringify(prev)
        prev = current
        return stable
      },
      { intervals: [250] }
    )
    .toBe(true)
}

const move = async (page: Page, name: string, targetName: string, position: 'right' | 'below') => {
  const box = await boxOf(nodeDefWrapper(page, name))
  const targetBox = await boxOf(nodeDefWrapper(page, targetName))
  const to =
    position === 'right'
      ? { x: targetBox.x + targetBox.width + 5, y: targetBox.y }
      : { x: targetBox.x, y: targetBox.y + targetBox.height + 5 }
  // the new layout is saved (with a debounce) after every move: wait for it before the next move
  const layoutSaved = page.waitForResponse(
    (response) => response.request().method() === 'PUT' && /\/nodeDefs?\//.test(response.url()) && response.ok()
  )
  await dragWithMouse(page, { x: box.x + 2, y: box.y + 2 }, to)
  await layoutSaved
  await waitForLayoutStable(page)
}

const moveRightOf = (page: Page, name: string, targetName: string) => move(page, name, targetName, 'right')
const moveBelow = (page: Page, name: string, targetName: string) => move(page, name, targetName, 'below')

/**
 * Moves a column of an entity table (native HTML5 drag and drop) next to another one.
 * @param {Page} page - The page.
 * @param {string} name - Name of the node def to move.
 * @param {string} targetName - Name of the node def to move the column next to.
 * @param {'left' | 'right'} side - Side of the target column where to drop the column.
 * @returns {Promise<void>} - Resolves when the column has been moved.
 */
const moveTableColumn = async (page: Page, name: string, targetName: string, side: 'left' | 'right') => {
  // the drag and drop listeners are on the draggable cell containing the node def
  const cell = (cellName: string) =>
    page
      .locator('.draggable-item')
      .filter({ has: page.getByTestId(TestId.surveyForm.nodeDefEntityTableCellWrapper(cellName)) })
      .first()
  const target = cell(targetName)
  const targetBox = await boxOf(target)
  await cell(name).dragTo(target, {
    targetPosition: { x: targetBox.width / 2 + (side === 'right' ? 5 : -5), y: 5 },
  })
}

test.describe('Node def reorder', () => {
  // long UI flow (many node defs edited and saved one by one)
  test.slow()

  // the whole cluster form must fit in the viewport: scrolling while dragging would make the positions change
  test.use({ sampleSurveyOptions: { publish: false }, viewport: { width: 1366, height: 1300 } })

  test('reorders the attributes in the form', async ({ page, sampleSurvey: _ }) => {
    const designer = new FormDesigner(page)
    await designer.goto()

    expect(await designer.childNames('cluster')).toEqual([
      'cluster_id',
      'cluster_decimal',
      'cluster_date',
      'cluster_time',
      'cluster_boolean',
      'cluster_coordinate',
      'cluster_country',
      'cluster_region',
      'cluster_province',
    ])

    await moveRightOf(page, 'cluster_date', 'cluster_id')
    await moveRightOf(page, 'cluster_time', 'cluster_date')
    await moveRightOf(page, 'cluster_decimal', 'cluster_boolean')
    await moveBelow(page, 'cluster_country', 'cluster_id')
    await moveBelow(page, 'cluster_region', 'cluster_date')
    await moveBelow(page, 'cluster_province', 'cluster_time')
    await moveBelow(page, 'cluster_coordinate', 'cluster_country')

    const expectedClusterOrder = [
      'cluster_id',
      'cluster_date',
      'cluster_time',
      'cluster_country',
      'cluster_region',
      'cluster_province',
      'cluster_coordinate',
      'cluster_boolean',
      'cluster_decimal',
    ]
    await expect.poll(() => designer.childNames('cluster')).toEqual(expectedClusterOrder)

    // the new layout has been saved
    await page.reload()
    await expect(designer.surveyForm).toBeVisible()
    await expect.poll(() => designer.childNames('cluster')).toEqual(expectedClusterOrder)
  })

  // FIXME: the column order changes in the page, but the new layout is never saved (no request is sent):
  // to be investigated (possibly a regression of the resizable table header changes, #4397)
  test.fixme('reorders the columns of an entity table', async ({ page, sampleSurvey: _ }) => {
    const designer = new FormDesigner(page)
    await designer.goto()
    await designer.gotoPage('plot')
    expect(await designer.childNames('tree')).toEqual(['tree_id', 'tree_dec_1', 'tree_dec_2', 'tree_species'])

    await moveTableColumn(page, 'tree_species', 'tree_id', 'right')
    await moveTableColumn(page, 'tree_dec_2', 'tree_dec_1', 'left')

    const expectedTreeOrder = ['tree_id', 'tree_species', 'tree_dec_2', 'tree_dec_1']
    await expect.poll(() => designer.childNames('tree')).toEqual(expectedTreeOrder)

    await page.reload()
    await expect(designer.surveyForm).toBeVisible()
    await designer.gotoPage('plot')
    await expect.poll(() => designer.childNames('tree')).toEqual(expectedTreeOrder)
  })
})
