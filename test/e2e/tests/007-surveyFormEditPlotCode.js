import * as NodeDef from '@core/survey/nodeDef'

import { dragAndDrop, getElement } from '../utils/api'
import { clickCategoryButtonClose, writeCategoryName } from '../utils/ui/categoryDetails'
import {
  addItemToPage,
  clickNodeDefCategoryAdd,
  clickNodeDefSaveAndBack,
  expectNodeDefCategoryIs,
  expectNodeDefCodeParentDisabled,
} from '../utils/ui/nodeDefDetail'
import { expectItemIsTheLastNodeDef, expectSurveyFormItemsAreInOrder } from '../utils/ui/surveyForm'

const nodeDefCode = { type: NodeDef.nodeDefType.code, name: 'country', label: 'Country', isKey: false }

const nodeDefItems = [
  { type: NodeDef.nodeDefType.integer, name: 'plot_id', label: 'Plot id', isKey: true },
  { type: NodeDef.nodeDefType.text, name: 'plot_text', label: 'Plot text', isKey: false },
  { type: NodeDef.nodeDefType.file, name: 'plot_file', label: 'Plot file', isKey: false },
  { type: NodeDef.nodeDefType.entity, name: 'tree', label: 'Tree', isKey: false },
  nodeDefCode,
]

const nodeItemsReOrdered = [
  nodeDefItems[0],
  nodeDefItems[nodeDefItems.length - 1], // country attribute
  ...nodeDefItems.slice(1, nodeDefItems.length - 1),
]

describe('SurveyForm edit Plot: code attribute', () => {
  test('Add code attribute "country"', async () => {
    await addItemToPage({ ...nodeDefCode, saveAndBack: false })

    await clickNodeDefCategoryAdd()
    const categoryName = 'administrative_unit'

    // start of category edit
    await writeCategoryName(categoryName)
    await clickCategoryButtonClose()
    // end of category edit

    await expectNodeDefCategoryIs(categoryName)
    await expectNodeDefCodeParentDisabled()

    await clickNodeDefSaveAndBack()

    await expectItemIsTheLastNodeDef({ item: nodeDefCode })
    await expectSurveyFormItemsAreInOrder({ items: nodeDefItems })
  })

  test('Re-order country', async () => {
    // move Country to right of Plot ID
    await dragAndDrop(await getElement({ text: 'COUNTRY' }), { up: 300, right: 300 })

    await expectSurveyFormItemsAreInOrder({ items: nodeItemsReOrdered })
  })
})
