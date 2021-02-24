import { DataTestId, getSelector } from '../../../webapp/utils/dataTestId'
import { cluster, plot, tree } from '../mock/nodeDefs'
import { gotoFormPage } from './_formDesigner'
import { gotoFormDesigner, gotoHome } from './_navigation'
import { enterNodeValue, verifyNodeValue } from './_record'
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
const { plot_id, plot_text } = plot.children
const { tree_id, tree_dec_1, tree_dec_2, tree_species } = tree.children

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

      verifyNodeValue(cluster_id, '')
      verifyNodeValue(cluster_boolean, 'true')
      verifyNodeValue(cluster_decimal, '')
      verifyNodeValue(cluster_country, '(0) country 0')
      verifyNodeValue(cluster_region, '')
      verifyNodeValue(cluster_province, '')
      verifyNodeValue(cluster_coordinate, { x: '', y: '', srs: '', srsLabel: '' })
      verifyNodeValue(cluster_time, () => startTime)
      verifyNodeValue(cluster_date, () => startTime)

      gotoFormPage(plot)

      test(`Verify ${plot.name} not required and not applicable`, async () => {
        const plotEl = await page.$(getSelector(plot.name))
        await expect(await plotEl.getAttribute('class')).toContain('not-applicable')

        await page.hover(`text="${plot_id.label}"`)
        await expect(page).not.toHaveText('Required value')
      })
    })

    describe(`Enter/verify ${cluster.name} values`, () => {
      gotoFormPage(cluster)

      enterNodeValue(cluster_id, recordPreview[cluster_id.name])
      enterNodeValue(cluster_boolean, recordPreview[cluster_boolean.name])
      enterNodeValue(cluster_decimal, recordPreview[cluster_decimal.name])
      enterNodeValue(cluster_region, recordPreview[cluster_region.name])
      enterNodeValue(cluster_province, recordPreview[cluster_province.name])
      enterNodeValue(cluster_coordinate, recordPreview[cluster_coordinate.name])
      enterNodeValue(cluster_time, recordPreview[cluster_time.name])

      verifyNodeValue(cluster_id, recordPreview[cluster_id.name])
      verifyNodeValue(cluster_boolean, recordPreview[cluster_boolean.name])
      verifyNodeValue(cluster_decimal, recordPreview[cluster_decimal.name])
      verifyNodeValue(cluster_region, recordPreview[cluster_region.name])
      verifyNodeValue(cluster_province, recordPreview[cluster_province.name])
      verifyNodeValue(cluster_coordinate, recordPreview[cluster_coordinate.name])
      verifyNodeValue(cluster_time, recordPreview[cluster_time.name])

      test(`Verify ${cluster_coordinate.name} invalid coordinate`, async () => {
        await page.waitForSelector(getSelector(DataTestId.surveyForm.nodeDefErrorBadge(cluster_coordinate.name)))
        await page.hover(`text="${cluster_coordinate.label}"`)
        await expect(page).toHaveText('Invalid value')
      })
    })

    describe(`Enter/verify ${plot.name} values`, () => {
      gotoFormPage(plot)

      test(`Verify ${plot.name} required and applicable`, async () => {
        const plotEl = await page.$(getSelector(plot.name))
        await expect(await plotEl.getAttribute('class')).not.toContain('not-applicable')

        await page.hover(`text="${plot_id.label}"`)
        await expect(page).toHaveText('Required value')
      })

      enterNodeValue(plot_id, recordPreview[plot_id.name])
      enterNodeValue(plot_text, recordPreview[plot_text.name])

      verifyNodeValue(plot_id, recordPreview[plot_id.name])
      verifyNodeValue(plot_text, recordPreview[plot_text.name])
    })

    describe(`Enter/verify ${tree.name} values`, () => {
      const tree1Selector = getSelector(DataTestId.surveyForm.entityRowData(tree.name, 0))
      const tree2Selector = getSelector(DataTestId.surveyForm.entityRowData(tree.name, 1))

      test(`Add ${tree.name}`, async () => {
        await page.click(getSelector(DataTestId.surveyForm.entityAddBtn(tree.name), 'button'))
        await page.click(getSelector(DataTestId.surveyForm.entityAddBtn(tree.name), 'button'))
        await expect(page).toHaveSelector(tree1Selector)
        await expect(page).toHaveSelector(tree2Selector)
      })

      test(`Verify ${tree_id.name} required and duplicate`, async () => {
        await page.hover(`${tree1Selector} ${getSelector(DataTestId.surveyForm.nodeDefErrorBadge(tree_id.name))}`)
        await expect(page).toHaveText('Required value, Duplicate entity key')
        await page.mouse.move(0, 0, { steps: 1 })
        await page.hover(`${tree2Selector} ${getSelector(DataTestId.surveyForm.nodeDefErrorBadge(tree_id.name))}`)
        await expect(page).toHaveText('Required value, Duplicate entity key')
      })
      // default values
      verifyNodeValue(
        tree_species,
        { code: 'ALB/GLA', scientificName: 'Albizia glaberrima', vernacularName: '' },
        tree1Selector
      )
      verifyNodeValue(
        tree_species,
        { code: 'ALB/GLA', scientificName: 'Albizia glaberrima', vernacularName: '' },
        tree2Selector
      )

      enterNodeValue(tree_id, recordPreview.trees[0][tree_id.name], tree1Selector)
      enterNodeValue(tree_dec_1, recordPreview.trees[0][tree_dec_1.name], tree1Selector)
      enterNodeValue(tree_dec_2, recordPreview.trees[0][tree_dec_2.name], tree1Selector)
      // TODO: uncomment below with https://github.com/openforis/arena/issues/1405
      // enterNodeValue(tree_species, recordPreview.trees[0][tree_species.name], tree1Selector)
      enterNodeValue(tree_id, recordPreview.trees[1][tree_id.name], tree2Selector)
      enterNodeValue(tree_dec_1, recordPreview.trees[1][tree_dec_1.name], tree2Selector)
      enterNodeValue(tree_dec_2, recordPreview.trees[1][tree_dec_2.name], tree2Selector)
      // TODO: uncomment below with https://github.com/openforis/arena/issues/1405
      // enterNodeValue(tree_species, recordPreview.trees[1][tree_species.name], tree2Selector)

      verifyNodeValue(tree_id, recordPreview.trees[0][tree_id.name], tree1Selector)
      verifyNodeValue(tree_dec_1, recordPreview.trees[0][tree_dec_1.name], tree1Selector)
      verifyNodeValue(tree_dec_2, recordPreview.trees[0][tree_dec_2.name], tree1Selector)
      // TODO: uncomment below with https://github.com/openforis/arena/issues/1405
      // verifyNodeValue(tree_species, recordPreview.trees[0][tree_species.name], tree1Selector)
      verifyNodeValue(tree_id, recordPreview.trees[1][tree_id.name], tree2Selector)
      verifyNodeValue(tree_dec_1, recordPreview.trees[1][tree_dec_1.name], tree2Selector)
      verifyNodeValue(tree_dec_2, recordPreview.trees[1][tree_dec_2.name], tree2Selector)
      // TODO: uncomment below with https://github.com/openforis/arena/issues/1405
      // verifyNodeValue(tree_species, recordPreview.trees[1][tree_species.name], tree2Selector)

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
