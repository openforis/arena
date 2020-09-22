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

const nodeDefItems = [
  { type: NodeDef.nodeDefType.integer, name: 'plot_id', label: 'Plot id', isKey: true },
  { type: NodeDef.nodeDefType.text, name: 'plot_text', label: 'Plot text', isKey: false },
  { type: NodeDef.nodeDefType.file, name: 'plot_file', label: 'Plot file', isKey: false },
  { type: NodeDef.nodeDefType.entity, name: 'tree', label: 'Tree', isKey: false },
  { type: NodeDef.nodeDefType.code, name: 'country', label: 'Country', isKey: false },
]

describe('SurveyForm edit Plot: add code attribute', () => {
  test(
    'Code attribute create',
    async () => {
      const codeValues = { type: NodeDef.nodeDefType.code, name: 'country', label: 'Country' }
      await addItemToPage({ ...codeValues, saveAndBack: false })

      await clickNodeDefCategoryAdd()

      // start of category edit
      await writeCategoryName('administrative_unit')
      await clickCategoryButtonClose()
      // end of category edit

      await expectNodeDefCategoryIs('administrative_unit')
      await expectNodeDefCodeParentIsDisabled()

      await clickNodeDefSaveAndClose()

      await expectItemIsTheLastNodeDef({ item: codeValues })
      await expectSurveyFormItemsAreInOrder({ items: nodeDefItems })
    },
    30 * 1000
  )

  test('Plot fill form code attribute', async () => {})
})
