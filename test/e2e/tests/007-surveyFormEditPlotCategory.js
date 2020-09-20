import * as NodeDef from '@core/survey/nodeDef'

import {
  addItemToPage,
  clickNodeDefCategoryAdd,
  expectItemIsTheLastNodeDef,
  expectCurrentPageIs,
  writeCategoryName,
  addCategoryLevel,
  clickCategoryButtonClose,
} from '../utils/ui'

const addCategory = async () => {
  await clickNodeDefCategoryAdd()
  await writeCategoryName('administrative_unit')

  await addCategoryLevel({ levelIndex: 0, text: 'country' })
  await addCategoryLevel({ levelIndex: 1, text: 'region' })
  await addCategoryLevel({ levelIndex: 2, text: 'district' })

  await clickCategoryButtonClose()
}

describe('SurveyForm edit Plot: add code attribute', () => {
  test('Code attribute create', async () => {
    const codeValues = { type: NodeDef.nodeDefType.code, name: 'country', label: 'Country' }
    await addItemToPage({ ...codeValues, saveAndBack: false })
    await addCategory()
    await expectCurrentPageIs({ label: 'Plot' })
    await expectItemIsTheLastNodeDef({ item: codeValues })
  })
})
