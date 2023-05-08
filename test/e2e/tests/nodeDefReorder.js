import { expect, test } from '@playwright/test'

import { TestId, getSelector } from '../../../webapp/utils/testId'
import { cluster, plot, tree } from '../mock/nodeDefs'
import { dragAndDrop, dragAndDropOver } from './utils/dragDrop'
import { gotoFormDesigner } from './_navigation'
import { gotoFormPage } from './_formDesigner'
import { publishWithoutErrors } from './_publish'

const getBBoxes = async ({ nodeDefTarget, nodeDefSource, insideTable = false }) => {
  const targetTestId = insideTable
    ? TestId.surveyForm.nodeDefEntityTableCellWrapper(nodeDefTarget.name)
    : TestId.surveyForm.nodeDefWrapper(nodeDefTarget.name)
  const targetEl = await page.$(getSelector(targetTestId))

  const sourceTestId = insideTable
    ? TestId.surveyForm.nodeDefEntityTableCellWrapper(nodeDefSource.name)
    : TestId.surveyForm.nodeDefWrapper(nodeDefSource.name)
  const sourceEl = await page.$(getSelector(sourceTestId))

  await targetEl.scrollIntoViewIfNeeded()

  const targetBBox = await targetEl.boundingBox()
  const sourceBBox = await sourceEl.boundingBox()
  return { targetEl, sourceEl, targetBBox, sourceBBox }
}

const getBoxCenter = (bBox) => ({
  x: bBox.x + bBox.width / 2,
  y: bBox.y + bBox.height / 2,
})

const moveRight = async (nodeDefTarget, nodeDefSource) => {
  const { targetBBox, sourceBBox } = await getBBoxes({ nodeDefTarget, nodeDefSource })
  await dragAndDrop(targetBBox.x + 2, targetBBox.y + 2, sourceBBox.x + sourceBBox.width + 5, sourceBBox.y)
}

const moveBelow = async (nodeDefTarget, nodeDefSource) => {
  const { targetBBox, sourceBBox } = await getBBoxes({ nodeDefTarget, nodeDefSource })
  await dragAndDrop(targetBBox.x + 2, targetBBox.y + 2, sourceBBox.x, sourceBBox.y + sourceBBox.height + 5)
}

const moveEntityTableCell =
  (offset = { x: 2, y: 2 }) =>
  async (nodeDefTarget, nodeDefSource) => {
    const { targetEl, sourceEl, targetBBox, sourceBBox } = await getBBoxes({
      nodeDefTarget,
      nodeDefSource,
      insideTable: true,
    })
    const from = { x: targetBBox.x + 5, y: targetBBox.y + 5 }
    const to = { x: getBoxCenter(sourceBBox).x + offset.x, y: sourceBBox.y + offset.y }
    await dragAndDropOver({ targetEl, sourceEl, from, to })
  }
const moveEntityTableCellRight = moveEntityTableCell({ x: 5, y: 2 })
const moveEntityTableCellLeft = moveEntityTableCell({ x: -5, y: 2 })

const verityEntityOrder = (nodeDef, expectedOrder) =>
  test(`Verify entity ${cluster.name} order`, async () => {
    const entityEl = await page.$(`[data-node-def-name="${nodeDef.name}"]`)
    const childNames = await entityEl.getAttribute('data-child-names')
    await expect(childNames).toBe(expectedOrder)
  })

export default () =>
  test.describe('NodeDef reorder', () => {
    gotoFormDesigner()

    verityEntityOrder(
      cluster,
      'cluster_id,cluster_decimal,cluster_date,cluster_time,cluster_boolean,cluster_coordinate,cluster_country,cluster_region,cluster_province'
    )

    test('Reorder cluster', async () => {
      await moveRight(cluster.children.cluster_date, cluster.children.cluster_id)
      await moveRight(cluster.children.cluster_time, cluster.children.cluster_date)
      await moveRight(cluster.children.cluster_decimal, cluster.children.cluster_boolean)
      await moveBelow(cluster.children.cluster_country, cluster.children.cluster_id)
      await moveBelow(cluster.children.cluster_region, cluster.children.cluster_date)
      await moveBelow(cluster.children.cluster_province, cluster.children.cluster_time)
      await moveBelow(cluster.children.cluster_coordinate, cluster.children.cluster_country)
      await page.waitForTimeout(1000)
    })

    test('Page reload', async () => {
      await page.reload()
      await page.waitForSelector(getSelector(TestId.surveyForm.surveyForm))
    })

    verityEntityOrder(
      cluster,
      'cluster_id,cluster_date,cluster_time,cluster_country,cluster_region,cluster_province,cluster_coordinate,cluster_boolean,cluster_decimal'
    )

    gotoFormPage(plot)

    verityEntityOrder(tree, 'tree_id,tree_dec_1,tree_dec_2,tree_species')

    test('Reorder tree', async () => {
      await moveEntityTableCellRight(tree.children.tree_species, tree.children.tree_id)
      await moveEntityTableCellLeft(tree.children.tree_dec_2, tree.children.tree_dec_1)
    })

    verityEntityOrder(tree, 'tree_id,tree_species,tree_dec_2,tree_dec_1')

    publishWithoutErrors()
  })
