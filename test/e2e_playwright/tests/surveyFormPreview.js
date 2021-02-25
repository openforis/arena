import { DataTestId, getSelector } from '../../../webapp/utils/dataTestId'
import { cluster, plot, tree } from '../mock/nodeDefs'
import { gotoFormPage } from './_formDesigner'
import { gotoFormDesigner, gotoHome } from './_navigation'
import { enterCluster, enterPlot, enterTrees, verifyAttribute, verifyCluster, verifyPlot, verifyTrees } from './_record'
import { recordPreview } from '../mock/recordPreview'

/* eslint-disable camelcase */
const {
  cluster_id,
  cluster_decimal,
  cluster_date,
  cluster_time,
  cluster_boolean,
  cluster_coordinate,
  cluster_country,
  cluster_region,
  cluster_province,
} = cluster.children
const { plot_id } = plot.children
const { tree_id, tree_dec_1 } = tree.children

export default () =>
  describe('SurveyForm preview', () => {
    let startTime = null

    gotoFormDesigner()

    test('Open preview', async () => {
      await page.click(getSelector(DataTestId.surveyForm.previewOpenBtn, 'button'))
      await page.waitForSelector(getSelector(DataTestId.surveyForm.surveyForm))
      startTime = new Date()
    })

    describe('Verify initial values/checks', () => {
      test(`Verify ${cluster.name} required`, async () => {
        await page.hover(`text="${cluster_id.label}"`)
        await expect(page).toHaveText('Required value')
      })

      verifyAttribute(cluster_id, '')
      verifyAttribute(cluster_boolean, 'true')
      verifyAttribute(cluster_decimal, '')
      verifyAttribute(cluster_country, '(0) country 0')
      verifyAttribute(cluster_region, '')
      verifyAttribute(cluster_province, '')
      verifyAttribute(cluster_coordinate, { x: '', y: '', srs: '', srsLabel: '' })
      verifyAttribute(cluster_time, () => startTime)
      verifyAttribute(cluster_date, () => startTime)

      gotoFormPage(plot)

      test(`Verify ${plot.name} not required and not applicable`, async () => {
        const plotEl = await page.$(getSelector(plot.name))
        await expect(await plotEl.getAttribute('class')).toContain('not-applicable')

        await page.hover(`text="${plot_id.label}"`)
        await expect(page).not.toHaveText('Required value')
      })
    })

    gotoFormPage(cluster)

    enterCluster(recordPreview)
    verifyCluster(recordPreview)

    test(`Verify ${cluster_coordinate.name} invalid coordinate`, async () => {
      await page.waitForSelector(getSelector(DataTestId.surveyForm.nodeDefErrorBadge(cluster_coordinate.name)))
      await page.hover(`text="${cluster_coordinate.label}"`)
      await expect(page).toHaveText('Invalid value')
    })

    gotoFormPage(plot)

    test(`Verify ${plot.name} required and applicable`, async () => {
      const plotEl = await page.$(getSelector(plot.name))
      await expect(await plotEl.getAttribute('class')).not.toContain('not-applicable')

      await page.hover(`text="${plot_id.label}"`)
      await expect(page).toHaveText('Required value')
    })
    enterPlot(recordPreview)
    verifyPlot(recordPreview)

    enterTrees(recordPreview)
    verifyTrees(recordPreview)

    describe(`Verify ${tree.name} validations`, () => {
      const tree1Selector = getSelector(DataTestId.surveyForm.entityRowData(tree.name, 0))
      const tree2Selector = getSelector(DataTestId.surveyForm.entityRowData(tree.name, 1))

      test(`Verify ${tree_id.name} duplicate`, async () => {
        await page.hover(`${tree1Selector} ${getSelector(DataTestId.surveyForm.nodeDefErrorBadge(tree_id.name))}`)
        await expect(page).toHaveText('Duplicate entity key')
        await page.mouse.move(0, 0, { steps: 1 })
        await page.hover(`${tree2Selector} ${getSelector(DataTestId.surveyForm.nodeDefErrorBadge(tree_id.name))}`)
        await expect(page).toHaveText('Duplicate entity key')
      })

      test(`Verify ${tree_dec_1.name} validation`, async () => {
        await page.hover(`${tree1Selector} ${getSelector(DataTestId.surveyForm.nodeDefErrorBadge(tree_dec_1.name))}`)
        await expect(page).toHaveText('tree_dec_1 > 0')

        const treeDec1Tree2BadgeEl = await page.$(
          `${tree2Selector} ${getSelector(DataTestId.surveyForm.nodeDefErrorBadge(tree_dec_1.name))}`
        )
        await expect(treeDec1Tree2BadgeEl).toBeNull()
      })

      // TODO: uncomment below with https://github.com/openforis/arena/issues/1409
      // test(`Verify ${tree_dec_2.name} validation`, async () => {
      //   await page.hover(`${tree1Selector} ${getSelector(DataTestId.surveyForm.nodeDefErrorBadge(tree_dec_2.name))}`)
      //   await expect(page).toHaveText('tree_dec_2 > 10')
      //
      //   await page.hover(`${tree2Selector} ${getSelector(DataTestId.surveyForm.nodeDefErrorBadge(tree_dec_2.name))}`)
      //   await expect(page).toHaveText('tree_dec_2 > 0')
      // })
    })

    gotoHome()
  })
