import { addItemToPage } from '../utils/ui/nodeDefDetail'
import { expectItemIsTheLastNodeDef, expectSurveyFormItems } from '../utils/ui/surveyForm'
import {
  addSurveyFormSubPage,
  expectEmptyPageHasError,
  expectCurrentPageIs,
  expectSurveyFormHasOnlyAndInOrderThesePages,
} from '../utils/ui/surveyFormPage'

const nodeDefItems = [
  { type: 'integer', name: 'plot_id', label: 'Plot id', isKey: true },
  { type: 'text', name: 'plot_text', label: 'Plot text', isKey: false },
  { type: 'file', name: 'plot_file', label: 'Plot file', isKey: false },
]

describe('SurveyForm edit Plot', () => {
  test('Plot create', async () => {
    const subPageValues = { name: 'plot', label: 'Plot', isMultiple: true }
    await addSurveyFormSubPage({ values: subPageValues })
    await expectSurveyFormHasOnlyAndInOrderThesePages({ pageLabels: ['Cluster', 'Plot'] })
    await expectCurrentPageIs({ name: 'plot' })
    await expectEmptyPageHasError()
  })

  test.each(nodeDefItems)('Plot add children %o', async (child) => {
    await addItemToPage(child)
    await expectItemIsTheLastNodeDef({ item: child })
  })

  test('Plot add children - verify number and order of children', async () =>
    expectSurveyFormItems({ items: nodeDefItems }))
})
