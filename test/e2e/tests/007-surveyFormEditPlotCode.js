import { dragAndDrop, getElement } from '../utils/api'
import { clickCategoryButtonClose, writeCategoryName } from '../utils/ui/categoryDetails'
import {
  addItemToPage,
  clickNodeDefCategoryAdd,
  clickNodeDefSaveAndBack,
  expectNodeDefCategoryIs,
  expectNodeDefCodeParentDisabled,
} from '../utils/ui/nodeDefDetail'
import { expectItemIsTheLastNodeDef, expectSurveyFormItems } from '../utils/ui/surveyForm'
import { treeNodeDef, basePlotNodeDefItems, countryNodeDef } from '../resources/nodeDefs/nodeDefs'

const nodeDefItems = [...basePlotNodeDefItems, treeNodeDef, countryNodeDef]

const nodeItemsReOrdered = [
  nodeDefItems[0],
  nodeDefItems[nodeDefItems.length - 1], // country attribute
  ...nodeDefItems.slice(1, nodeDefItems.length - 1),
]

describe('SurveyForm edit Plot: code attribute', () => {
  test('Add code attribute "country"', async () => {
    await addItemToPage({ ...countryNodeDef, saveAndBack: false })

    await clickNodeDefCategoryAdd()
    const categoryName = 'administrative_unit'

    // start of category edit
    await writeCategoryName(categoryName)
    await clickCategoryButtonClose()
    // end of category edit

    await expectNodeDefCategoryIs(categoryName)
    await expectNodeDefCodeParentDisabled()

    await clickNodeDefSaveAndBack()

    await expectItemIsTheLastNodeDef({ item: countryNodeDef })
    await expectSurveyFormItems({ items: nodeDefItems })
  })

  test('Re-order country', async () => {
    // move Country to right of Plot ID
    await dragAndDrop(await getElement({ text: 'Country' }), { up: 300, right: 300 })

    await expectSurveyFormItems({ items: nodeItemsReOrdered })
  })
})
