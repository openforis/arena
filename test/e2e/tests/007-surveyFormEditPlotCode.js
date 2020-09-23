import * as NodeDef from '@core/survey/nodeDef'

import { dragAndDrop, getElement } from '../utils/api'
import {
  addItemToPage,
  expectItemIsTheLastNodeDef,
  expectSurveyFormItemsAreInOrder,
  clickNodeDefCategoryAdd,
  clickNodeDefSaveAndClose,
  expectNodeDefCategoryIs,
  expectNodeDefCodeParentIsDisabled,
  writeCategoryName,
  clickCategoryButtonClose,
} from '../utils/ui'

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

    // start of category edit
    await writeCategoryName('administrative_unit')
    await clickCategoryButtonClose()
    // end of category edit

    await expectNodeDefCategoryIs('administrative_unit')
    await expectNodeDefCodeParentIsDisabled()

    await clickNodeDefSaveAndClose()

    await expectItemIsTheLastNodeDef({ item: nodeDefCode })
    await expectSurveyFormItemsAreInOrder({ items: nodeDefItems })
  }, 30000)

  test('Re-order country', async () => {
    // move Country to right of Plot ID
    await dragAndDrop(await getElement({ text: 'COUNTRY' }), { up: 350, right: 300 })

    await expectSurveyFormItemsAreInOrder({ items: nodeItemsReOrdered })
  })
})
