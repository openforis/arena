import { expect, test } from '@playwright/test'

import { TestId, getSelector } from '../../../../webapp/utils/testId'

import { cluster, plot, tree } from '../../mock/nodeDefs'
import { enterAttribute } from './enterAttributes'
import { verifyAttribute } from './verifyAttributes'
import { getTreeSelector } from './utils'

/* eslint-disable camelcase */
const {
  cluster_id,
  cluster_decimal,
  cluster_time,
  cluster_boolean,
  cluster_coordinate,
  cluster_region,
  cluster_province,
} = cluster.children
const { plot_id, plot_text } = plot.children
const { tree_id, tree_dec_1, tree_dec_2, tree_species } = tree.children

export const enterCluster = (record) =>
  test.describe(`Enter ${cluster.name} values`, () => {
    enterAttribute(cluster_id, record[cluster_id.name])
    enterAttribute(cluster_boolean, record[cluster_boolean.name])
    enterAttribute(cluster_decimal, record[cluster_decimal.name])
    enterAttribute(cluster_region, record[cluster_region.name])
    enterAttribute(cluster_province, record[cluster_province.name])
    enterAttribute(cluster_coordinate, record[cluster_coordinate.name])
    enterAttribute(cluster_time, record[cluster_time.name])
  })

export const enterPlot = (record) =>
  test.describe(`Enter ${plot.name} values`, () => {
    test('Add new plot', async () => {
      await page.click(getSelector(TestId.entities.form.addNewNode, 'button'))
      await expect(page).toHaveSelector(getSelector(TestId.entities.form.nodeSelect), 'select')
    })
    test(`Test ${plot_id.name} is required`, async () => {
      await page.hover(getSelector(TestId.surveyForm.nodeDefErrorBadge(plot_id.name)))
      const tooltipEl = await page.waitForSelector('.tooltip__message-error')
      await expect(tooltipEl).toHaveText('Required value')
    })
    enterAttribute(plot_id, record[plot_id.name])
    enterAttribute(plot_text, record[plot_text.name])
  })

export const enterTrees = (record) => {
  const { trees } = record

  describe.each(Array.from(Array(trees.length).keys()))(`Add tree %s`, (treeIdx) => {
    const treeEntry = trees[treeIdx]
    const treeSelector = getTreeSelector(treeIdx)

    test('Add tree', async () => {
      await page.click(getSelector(TestId.surveyForm.entityAddBtn(tree.name), 'button'))
      await expect(page).toHaveSelector(treeSelector)
    })

    // verify default values before entering
    test(`Verify ${tree_id.name} required`, async () => {
      await page.hover(`${treeSelector} ${getSelector(TestId.surveyForm.nodeDefErrorBadge(tree_id.name))}`)
      const tooltipEl = await page.waitForSelector('.tooltip__message-error')
      await expect(tooltipEl).toHaveText('Required value')
      await page.mouse.move(0, 0, { steps: 1 })
    })

    verifyAttribute(
      tree_species,
      { code: 'ALB/GLA', scientificName: 'Albizia glaberrima', vernacularName: '' },
      treeSelector
    )

    // enter values
    enterAttribute(tree_id, treeEntry[tree_id.name], treeSelector)
    enterAttribute(tree_dec_1, treeEntry[tree_dec_1.name], treeSelector)
    enterAttribute(tree_dec_2, treeEntry[tree_dec_2.name], treeSelector)
    enterAttribute(tree_species, treeEntry[tree_species.name], treeSelector)
  })
}
