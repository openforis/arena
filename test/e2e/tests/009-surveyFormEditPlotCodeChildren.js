import { click, dragAndDrop } from 'taiko'

import * as NodeDef from '@core/survey/nodeDef'

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
import { expectSurveyFormItemNamesAreInOrder, expectSurveyFormLoaded } from '../utils/ui/surveyForm'
import { getElement } from '../utils/api'

describe('SurveyForm edit: plot code children', () => {
  test('Plot add code attribute "region"', async () => {
    await waitForLoader()

    await clickSidebarBtnSurveyForm()
    await expectSurveyFormLoaded()

    await click('Plot')
    await addItemToPage({ type: NodeDef.nodeDefType.code, name: 'region', label: 'Region', saveAndBack: false })

    await selectNodeDefCategory({ category: 'administrative_unit' })

    await expectNodeDefCodeParentEnabled()

    await expectNodeDefCodeParentItems({ items: ['country'] })

    await selectNodeDefCodeParent({ nodeDefName: 'country' })

    await clickNodeDefSaveAndBack()

    await expectSurveyFormItemNamesAreInOrder({
      itemNames: ['plot_id', 'country', 'plot_text', 'plot_file', 'tree', 'region'],
    })
  }, 30000)

  test('Plot re-order region', async () => {
    await dragAndDrop(await getElement({ text: 'REGION' }), { up: 250, right: 300 })

    await expectSurveyFormItemNamesAreInOrder({
      itemNames: ['plot_id', 'country', 'plot_text', 'region', 'plot_file', 'tree'],
    })
  })
})
