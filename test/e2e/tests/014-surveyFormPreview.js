import { click, clickParent, waitFor } from '../utils/api'
import { waitForLoader } from '../utils/ui/loader'
import { clickSidebarBtnSurveyForm } from '../utils/ui/sidebar'
import { expectSurveyFormLoaded } from '../utils/ui/surveyForm'
import { expectSurveyFormHasOnlyAndInOrderThesePages } from '../utils/ui/surveyFormPage'
import { clickHeaderBtnMySurveys } from '../utils/ui/header'
import { enterValuesCluster, enterValuesPlot, checkValuesCluster, checkValuesPlot } from '../utils/ui/nodeDefs'
import { records } from '../resources/records/recordsData'

const { cluster: ClusterItems, plots } = records[0]

describe('SurveyForm Preview', () => {
  test('Select survey 1', async () => {
    await waitFor(2000)
    await clickHeaderBtnMySurveys()
    await clickParent('Survey')

    await waitFor(2000)
    await waitForLoader()

    await waitFor(2000)
    await clickSidebarBtnSurveyForm()

    await expectSurveyFormLoaded()

    await expectSurveyFormHasOnlyAndInOrderThesePages({ pageLabels: ['Cluster', 'Plot'] })
  })

  test('Open preview', async () => {
    await click('Preview')
    await expectSurveyFormHasOnlyAndInOrderThesePages({ pageLabels: ['Cluster', 'Plot'] })
  })

  test('Enter Cluster nodes', async () => enterValuesCluster({ items: ClusterItems }))

  test('Enter Plot 1 values', async () => enterValuesPlot({ items: plots[0] }), 40000)

  test('Enter Plot 2 values', async () => enterValuesPlot({ items: plots[1] }), 40000)

  test('Check Cluster values', async () => {
    await click('Cluster')
    await waitFor(500)
    await checkValuesCluster({ items: ClusterItems })
  }, 40000)

  test('Check Plot 1 values', async () => checkValuesPlot({ id: 1, items: plots[0] }), 40000)

  test('Check Plot 2 values', async () => checkValuesPlot({ id: 2, items: plots[1] }), 40000)
})
