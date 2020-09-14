import {
  addItemToPage,
  expectItemIsTheLastNodeDef,
  expectCurrentPageIs,
  expectSurveyFormEntityItemsAreInOrder,
} from '../utils/ui'

const nodeDefItems = [
  { type: 'integer', name: 'tree_id', label: 'Tree id', isKey: true },
  { type: 'text', name: 'tree_text', label: 'Tree text', isKey: false },
  { type: 'file', name: 'tree_file', label: 'Tree file', isKey: false },
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
    expectSurveyFormEntityItemsAreInOrder({ items: nodeDefItems }))
})
