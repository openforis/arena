import { DataTestId, getSelector } from '../../../webapp/utils/dataTestId'
import { cluster } from '../mock/nodeDefs'
import { dragAndDrop } from './utils/dragDrop'
import { gotoFormDesigner } from './_navigation'
import { publishWithoutErrors } from './_publish'

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

// TODO: uncomment when testing tree reorder
// const moveLeft = async (nodeDefTarget, nodeDefSource) => {
//   const { targetBBox, sourceBBox } = await getBBoxes(nodeDefTarget, nodeDefSource)
//   await dragAndDrop(targetBBox.x + 2, targetBBox.y + 2, sourceBBox.x, sourceBBox.y)
// }

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
      await Promise.all([page.waitForSelector(getSelector(DataTestId.surveyForm.surveyForm)), page.reload()])
    })

    verityEntityOrder(
      cluster,
      'cluster_id,cluster_date,cluster_time,cluster_country,cluster_region,cluster_province,cluster_coordinate,cluster_boolean,cluster_decimal'
    )

    // TODO - it seems that reordering nodeDef table isn't working anymore. see https://github.com/openforis/arena/issues/1397
    // gotoFormPage(plot)
    //
    // verityEntityOrder(tree, 'tree_id,tree_dec_1,tree_dec_2,tree_species')
    //
    // test('Reorder tree', async () => {
    //   await moveRight(tree.children.tree_species, tree.children.tree_id)
    //   await moveLeft(tree.children.tree_dec_2, tree.children.tree_dec_1)
    // })
    //
    // verityEntityOrder(tree, 'tree_id,tree_species,tree_dec_2,tree_dec_1')

    publishWithoutErrors()
  })
