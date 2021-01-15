import { addItemToPage } from '../utils/ui/nodeDefDetail'
import { expectItemIsTheLastNodeDef, expectSurveyFormItemNames } from '../utils/ui/surveyForm'
import { expectCurrentPageIs } from '../utils/ui/surveyFormPage'

import { baseTreeNodeDefItems, treeNodeDef } from '../resources/nodeDefs/nodeDefs'

const nodeDefItems = baseTreeNodeDefItems

describe('SurveyForm edit Tree', () => {
  test('Tree create', async () => {
    const treeValues = treeNodeDef
    await addItemToPage(treeValues)
    await expectItemIsTheLastNodeDef({ item: treeValues })
    await expectCurrentPageIs({ name: 'plot' })
  })

  test.each(nodeDefItems)('Tree add children %o', async (child) => {
    await addItemToPage({ ...child, addButtonSelector: '.survey-form__node-def-page-item .icon-plus' })
    await expectItemIsTheLastNodeDef({ item: child })
  })

  test('Tree add children - verify number and order of children', async () =>
    expectSurveyFormItemNames({
      entityName: 'tree',
      itemNames: ['tree_id', 'tree_dec_1', 'tree_dec_2'],
    }))
})
