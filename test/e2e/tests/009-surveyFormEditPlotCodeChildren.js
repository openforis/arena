import * as NodeDef from '@core/survey/nodeDef'

import { click, dragAndDrop, expectExists, getElement, reload, waitFor1sec } from '../utils/api'
import { waitForLoader } from '../utils/ui/loader'
import {
  addItemToPage,
  clickNodeDefSaveAndBack,
  expectNodeDefCodeParentEnabled,
  expectNodeDefCodeParentItems,
  selectNodeDefCategory,
  selectNodeDefCodeParent,
} from '../utils/ui/nodeDefDetail'
import { clickSidebarBtnSurveyForm } from '../utils/ui/sidebar'
import { expectSurveyFormItemNames } from '../utils/ui/surveyForm'

const category = 'administrative_unit'

const _goToPlotPage = async () => {
  await waitForLoader()
  await waitFor1sec()
  await clickSidebarBtnSurveyForm()
  await click('Plot')
}

describe('SurveyForm edit: Plot code children', () => {
  test('Plot add code attribute "region"', async () => {
    await _goToPlotPage()

    await addItemToPage({ type: NodeDef.nodeDefType.code, name: 'region', label: 'Region', saveAndBack: false })

    await selectNodeDefCategory({ category })

    await expectNodeDefCodeParentEnabled()

    await expectNodeDefCodeParentItems({ items: ['country'] })

    await selectNodeDefCodeParent({ nodeDefName: 'country' })

    await clickNodeDefSaveAndBack()

    await expectSurveyFormItemNames({
      itemNames: ['plot_id', 'country', 'plot_text', 'plot_file', 'tree', 'region'],
    })
  }, 30000)

  test('Plot re-order "region"', async () => {
    await dragAndDrop(await getElement({ text: 'Region' }), { up: 250, right: 300 })

    await expectSurveyFormItemNames({
      itemNames: ['plot_id', 'country', 'plot_text', 'region', 'plot_file', 'tree'],
    })
  })

  test('Plot add code attribute "province"', async () => {
    await addItemToPage({ type: NodeDef.nodeDefType.code, name: 'province', label: 'Province', saveAndBack: false })

    await selectNodeDefCategory({ category })

    await expectNodeDefCodeParentEnabled()

    await expectNodeDefCodeParentItems({ items: ['country', 'region'] })

    await selectNodeDefCodeParent({ nodeDefName: 'region' })

    await clickNodeDefSaveAndBack()

    await expectSurveyFormItemNames({
      itemNames: ['plot_id', 'country', 'plot_text', 'region', 'plot_file', 'tree', 'province'],
    })
  })

  test('Plot re-order "province"', async () => {
    await expectExists({ text: 'Province' })
    await dragAndDrop(await getElement({ text: 'Province' }), { up: 150, right: 300 })
    await waitForLoader()
  })

  test('check order', async () => {
    await reload()
    await waitFor1sec()

    await _goToPlotPage()

    await expectSurveyFormItemNames({
      itemNames: ['plot_id', 'country', 'plot_text', 'region', 'plot_file', 'province', 'tree'],
    })
  })
})
