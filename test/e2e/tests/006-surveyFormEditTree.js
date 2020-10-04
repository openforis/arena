import { addItemToPage } from '../utils/ui/nodeDefDetail'
import { expectItemIsTheLastNodeDef, expectSurveyFormItemNames } from '../utils/ui/surveyForm'
import { expectCurrentPageIs } from '../utils/ui/surveyFormPage'

const nodeDefItems = [
  { type: 'integer', name: 'tree_id', label: 'Tree id', isKey: true },
  { type: 'decimal', name: 'tree_dec_1', label: 'Tree decimal 1', isKey: false },
  { type: 'decimal', name: 'tree_dec_2', label: 'Tree decimal 2', isKey: false },
]

describe('SurveyForm edit Tree', () => {
  test('Tree create', async () => {
    const treeValues = { type: 'entity', name: 'tree', label: 'Tree' }
    await addItemToPage(treeValues)
    await expectItemIsTheLastNodeDef({ item: treeValues })
    await expectCurrentPageIs({ label: 'Plot' })
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
