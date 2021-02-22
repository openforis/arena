import { getSelector } from '../../../webapp/utils/dataTestId'
import { cluster } from '../mock/nodeDefs'
import { gotoFormPage } from './_surveyForm'
import { dragAndDrop } from './utils/dragDrop'

const getBBoxes = async (nodeDefTarget, nodeDefSource) => {
  const targetEl = await page.$(getSelector(nodeDefTarget.name))
  const sourceEl = await page.$(getSelector(nodeDefSource.name))
  await targetEl.scrollIntoViewIfNeeded()
  const targetBBox = await targetEl.boundingBox()
  const sourceBBox = await sourceEl.boundingBox()
  return { targetBBox, sourceBBox }
}

const moveRight = async (nodeDefTarget, nodeDefSource) => {
  const { targetBBox, sourceBBox } = await getBBoxes(nodeDefTarget, nodeDefSource)
  await dragAndDrop(targetBBox.x + 2, targetBBox.y + 2, sourceBBox.x + sourceBBox.width + 5, sourceBBox.y)
}

const moveBelow = async (nodeDefTarget, nodeDefSource) => {
  const { targetBBox, sourceBBox } = await getBBoxes(nodeDefTarget, nodeDefSource)
  await dragAndDrop(targetBBox.x + 2, targetBBox.y + 2, sourceBBox.x, sourceBBox.y + sourceBBox.height + 5)
}

const verityEntityOrder = (nodeDef, expectedOrder) =>
  test(`Verify entity ${cluster.name} order`, async () => {
    const entityEl = await page.$(`[data-node-def-name="${nodeDef.name}"]`)
    const childNames = await entityEl.getAttribute('data-child-names')
    await expect(childNames).toBe(expectedOrder)
  })

export default () =>
  describe('NodeDef reorder', () => {
    gotoFormPage(cluster)

    verityEntityOrder(
      cluster,
      'cluster_id,cluster_decimal,cluster_date,cluster_time,cluster_boolean,cluster_coordinate,cluster_country,cluster_region,cluster_province'
    )

    test('Reorder cluster', async () => {
      await page.screenshot({ path: '/Users/minotogna/Desktop/sc1.jpg' })
      await moveRight(cluster.children.cluster_date, cluster.children.cluster_id)
      await page.screenshot({ path: '/Users/minotogna/Desktop/sc2.jpg' })
      await moveRight(cluster.children.cluster_time, cluster.children.cluster_date)
      await page.screenshot({ path: '/Users/minotogna/Desktop/sc3.jpg' })
      await moveRight(cluster.children.cluster_decimal, cluster.children.cluster_boolean)
      await page.screenshot({ path: '/Users/minotogna/Desktop/sc4.jpg' })
      await moveBelow(cluster.children.cluster_country, cluster.children.cluster_id)
      await page.screenshot({ path: '/Users/minotogna/Desktop/sc5.jpg' })
      // await scrollIntoViewIfNeeded(cluster.children.cluster_region)
      await page.screenshot({ path: '/Users/minotogna/Desktop/sc6.jpg' })
      await moveBelow(cluster.children.cluster_region, cluster.children.cluster_date)
      await page.screenshot({ path: '/Users/minotogna/Desktop/sc7.jpg' })
      // await scrollIntoViewIfNeeded(cluster.children.cluster_province)
      await page.screenshot({ path: '/Users/minotogna/Desktop/sc8.jpg' })
      await moveBelow(cluster.children.cluster_province, cluster.children.cluster_time)
      await page.screenshot({ path: '/Users/minotogna/Desktop/sc9.jpg' })
      await moveBelow(cluster.children.cluster_coordinate, cluster.children.cluster_country)
      await page.screenshot({ path: '/Users/minotogna/Desktop/sc10.jpg' })
    })

    verityEntityOrder(
      cluster,
      'cluster_id,cluster_date,cluster_time,cluster_country,cluster_region,cluster_province,cluster_coordinate,cluster_boolean,cluster_decimal'
    )

    // TODO - it seems that reordering nodeDef table isn't working anymore
    // gotoFormPage(plot)
    //
    // verityEntityOrder(tree, 'tree_id,tree_dec_1,tree_dec_2,tree_species')
    //
    // test('Reorder tree', async () => {
    //   await moveRight(tree.children.tree_species, tree.children.tree_id)
    // })
  })
