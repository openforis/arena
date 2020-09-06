import {
  addItemToPage,
  addSubPage,
  expectItemIsTheLastNodeDef,
  expectItemsAreInOrderAsNodeDef,
  expectEmptyPageHasError,
  expectCurrentPageIs,
  expectFormHasOnlyAndInOrderThesePages,
} from '../utils/ui'

const nodeDefItems = [
  { type: 'integer', name: 'plot_id', label: 'Tree id', isKey: true },
  { type: 'text', name: 'plot_text', label: 'Tree text', isKey: false },
  { type: 'file', name: 'plot_file', label: 'Tree file', isKey: false },
]

describe('SurveyForm edit Tree', () => {
  test('Tree create', async () => {
    const subPageValues = { name: 'Tree', label: 'Tree', isMultiple: true }
    await addSubPage({ values: subPageValues })
    await expectFormHasOnlyAndInOrderThesePages({ pageLabels: ['Cluster', 'Plot', 'Tree'] })
    await expectCurrentPageIs({ label: 'Tree' })
    await expectEmptyPageHasError()
  })

  test.each(nodeDefItems)('Tree add children %o', async (child) => {
    await addItemToPage(child)
    await expectItemIsTheLastNodeDef({ item: child })
  })

  test('Tree add children - verify number and order of children', async () =>
    expectItemsAreInOrderAsNodeDef({ items: nodeDefItems }))
})
