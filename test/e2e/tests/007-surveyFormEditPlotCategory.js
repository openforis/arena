import * as NodeDef from '@core/survey/nodeDef'
import { expectToBe } from '../utils/api'

import {
  addItemToPage,
  clickNodeDefCategoryAdd,
  writeCategoryName,
  addCategoryLevel,
  updateCategoryLevelName,
  clickSidebarBtnSurveyForm,
  expectSurveyFormLoaded,
  waitForLoader,
} from '../utils/ui'

describe('SurveyForm edit Plot: add code attribute', () => {
  test('Code attribute create', async () => {
    await waitForLoader()
    await clickSidebarBtnSurveyForm()
    await expectSurveyFormLoaded()

    const codeValues = { type: NodeDef.nodeDefType.code, name: 'country', label: 'Country' }
    await addItemToPage({ ...codeValues, saveAndBack: false })
  })

  test('Code attribute - create category', async () => {
    await clickNodeDefCategoryAdd()
    await writeCategoryName('administrative_unit')

    await updateCategoryLevelName({ levelIndex: 0, name: 'country' })
    await addCategoryLevel({ levelIndex: 1, name: 'region' })
    await addCategoryLevel({ levelIndex: 2, name: 'district' })

    await expectToBe({ selector: '.category__level', numberOfItems: 3 })
  })

  //     await expectCurrentPageIs({ label: 'Plot' })
  //   await expectItemIsTheLastNodeDef({ item: codeValues })
})
