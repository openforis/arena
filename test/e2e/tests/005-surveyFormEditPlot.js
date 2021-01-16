import { addItemToPage } from '../utils/ui/nodeDefDetail'
import { expectItemIsTheLastNodeDef, expectSurveyFormItems } from '../utils/ui/surveyForm'
import {
  addSurveyFormSubPage,
  expectEmptyPageHasError,
  expectCurrentPageIs,
  expectSurveyFormHasOnlyAndInOrderThesePages,
} from '../utils/ui/surveyFormPage'

import { basePlotNodeDefItems, plotNodeDef } from '../resources/nodeDefs/nodeDefs'

const nodeDefItems = basePlotNodeDefItems

describe('SurveyForm edit Plot', () => {
  test('Plot create', async () => {
    const subPageValues = plotNodeDef
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
