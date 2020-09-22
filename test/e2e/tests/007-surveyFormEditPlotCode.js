import * as NodeDef from '@core/survey/nodeDef'

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

// TODO get it from previous test?
const nodeDefItemsTree = [
  { type: 'integer', name: 'tree_id', label: 'Tree id', isKey: true },
  { type: 'decimal', name: 'tree_dec_1', label: 'Tree decimal 1', isKey: false },
  { type: 'decimal', name: 'tree_dec_2', label: 'Tree decimal 2', isKey: false },
]

const nodeDefItems = [
  { type: NodeDef.nodeDefType.integer, name: 'plot_id', label: 'Plot id', isKey: true },
  { type: NodeDef.nodeDefType.text, name: 'plot_text', label: 'Plot text', isKey: false },
  { type: NodeDef.nodeDefType.file, name: 'plot_file', label: 'Plot file', isKey: false },
  { type: NodeDef.nodeDefType.entity, name: 'tree', label: 'Tree', isKey: false },
  ...nodeDefItemsTree,
  nodeDefCode,
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
  })
})
