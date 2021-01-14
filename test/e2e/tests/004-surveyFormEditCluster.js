import { click, expectExists, expectToBe, getElement } from '../utils/api'
import { waitForLoader } from '../utils/ui/loader'
import { addItemToPage } from '../utils/ui/nodeDefDetail'
import { clickSidebarBtnSurveyForm } from '../utils/ui/sidebar'
import { expectItemIsTheLastNodeDef, expectSurveyFormItems, expectSurveyFormLoaded } from '../utils/ui/surveyForm'
import { editSurveyFormPage } from '../utils/ui/surveyFormPage'

const expectHasOnlyRootEntity = async ({ rootEntityName }) => {
  await expectToBe({ selector: '.btn-node-def', numberOfItems: 1 })
  await expectToBe({ selector: `//button[text()='${rootEntityName}']`, numberOfItems: 1 })
}

const nodeDefItems = [
  { type: 'integer', name: 'cluster_id', label: 'Cluster id', isKey: true },
  { type: 'decimal', name: 'cluster_decimal', label: 'Cluster decimal' },
  { type: 'date', name: 'cluster_date', label: 'Cluster date' },
  { type: 'time', name: 'cluster_time', label: 'Cluster time' },
  { type: 'boolean', name: 'cluster_boolean', label: 'Cluster boolean' },
  { type: 'coordinate', name: 'cluster_coordinate', label: 'Cluster coordinate' },
]

describe('SurveyForm edit cluster', () => {
  test('SurveyForm cluster', async () => {
    await clickSidebarBtnSurveyForm()

    await expectSurveyFormLoaded()

    await expectExists({ selector: `//button[text()='root_entity']` })

    await expectHasOnlyRootEntity({ rootEntityName: 'root_entity' })
  })

  test('Publish root_entity error', async () => {
    await click('Publish')
    await waitForLoader()
    await click('OK')
    await expectExists({ text: 'Define at least one key attribute' })
    await expectExists({ text: 'Define at least one child item' })
    await click('Close')
  })

  test('root_entity rename', async () => {
    await click(await getElement({ selector: '.icon-pencil2' }))

    const pageValues = { name: 'cluster', label: 'Cluster' }
    await editSurveyFormPage({ values: pageValues })

    await expectSurveyFormLoaded()
    await expectHasOnlyRootEntity({ rootEntityName: 'Cluster' })
  })

  test.each(nodeDefItems)('Cluster add children %o', async (child) => {
    await addItemToPage(child)
    await expectItemIsTheLastNodeDef({ item: child })
  })

  test('Cluster add children - verify order and number of children', async () =>
    expectSurveyFormItems({ items: nodeDefItems }))
})
