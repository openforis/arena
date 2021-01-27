import * as NodeDef from '@core/survey/nodeDef'

import { click, clickParent, waitFor } from '../utils/api'
import { waitForLoader } from '../utils/ui/loader'
import { clickSidebarBtnSurveyForm } from '../utils/ui/sidebar'
import { expectSurveyFormLoaded } from '../utils/ui/surveyForm'
import { expectSurveyFormHasOnlyAndInOrderThesePages } from '../utils/ui/surveyFormPage'
import { clickHeaderBtnMySurveys } from '../utils/ui/header'
import {
  enterValuesCluster,
  enterValuesPlot,
  checkValuesCluster,
  checkValuesPlot,
  expectIsRelevant,
  expectIsNotRelevant,
  expectIsValid,
  expectIsInvalid,
} from '../utils/ui/nodeDefs'
import { records, recordInitial } from '../resources/records/recordsData'

const { cluster: ClusterItems, plots } = records[0]

describe('SurveyForm Preview', () => {
  test('Select survey', async () => {
    await waitFor(3000)
    await clickHeaderBtnMySurveys()
    await clickParent('Survey')

    await waitFor(3000)
    await waitForLoader()

    await waitFor(3000)
    await clickSidebarBtnSurveyForm()

    await expectSurveyFormLoaded()

    await expectSurveyFormHasOnlyAndInOrderThesePages({ pageLabels: ['Cluster', 'Plot'] })
  })

  test('Open preview', async () => {
    await waitFor(3000)
    await click('Preview')
    await waitFor(3000)
    await expectSurveyFormHasOnlyAndInOrderThesePages({ pageLabels: ['Cluster', 'Plot'] })
    await waitFor(3000)
  })

  test('Expect default values are set', async () => {
    const { cluster } = recordInitial
    await checkValuesCluster({ items: cluster })
  }, 20000)

  test('Enter Cluster nodes', async () => enterValuesCluster({ items: ClusterItems }), 50000)

  test('Check relevance applied', async () => {
    const clusterDateLabel = 'Cluster date'

    // cluster_date relevant at the beginning (cluster_decimal = 10)
    await expectIsRelevant({ label: clusterDateLabel })

    const clusterDecimalItem = (value) => ({ label: 'Cluster Decimal', type: NodeDef.nodeDefType.decimal, value })

    // cluster_decimal = 0 => cluster_date not relevant
    await enterValuesCluster({ items: [clusterDecimalItem(0)] })
    await expectIsNotRelevant({ label: clusterDateLabel })

    // cluster_decimal = 1 => cluster_date relevant
    await enterValuesCluster({ items: [clusterDecimalItem(1)] })
    await expectIsRelevant({ label: clusterDateLabel })
  }, 30000)

  test('Check validation rules applied (decimal)', async () => {
    const clusterDecimalLabel = 'Cluster decimal'

    // cluster_id = 1 => cluster_decimal should be < 10
    // cluster_decimal valid (cluster_decimal = 1)
    await expectIsValid({ label: clusterDecimalLabel })

    const clusterDecimalItem = (value) => ({ label: clusterDecimalLabel, type: NodeDef.nodeDefType.decimal, value })

    // cluster_decimal = 11 => invalid
    await enterValuesCluster({ items: [clusterDecimalItem(11)] })
    await expectIsInvalid({ label: clusterDecimalLabel })

    // cluster_decimal = 9 => valid
    await enterValuesCluster({ items: [clusterDecimalItem(9)] })
    await expectIsValid({ label: clusterDecimalLabel })

    // cluster_decimal = 10 => invalid
    await enterValuesCluster({ items: [clusterDecimalItem(10)] })
    await expectIsInvalid({ label: clusterDecimalLabel })
  }, 30000)

  test('Check validation rules applied (date)', async () => {
    const clusterDateLabel = 'Cluster date'

    // cluster_date valid at the beginning (cluster_date = 2021-01-27, it should be >= 2021-01-01)
    await expectIsValid({ label: clusterDateLabel })

    const clusterDateItem = (value) => ({ label: clusterDateLabel, type: NodeDef.nodeDefType.date, value })

    // cluster_date = '2020-05-20' => invalid
    await enterValuesCluster({ items: [clusterDateItem('2020-05-20')] })
    await expectIsInvalid({ label: clusterDateLabel })

    // cluster_date = '2020-12-31' => invalid
    await enterValuesCluster({ items: [clusterDateItem('2020-12-31')] })
    await expectIsInvalid({ label: clusterDateLabel })

    // cluster_date = '2021-01-01 => valid
    await enterValuesCluster({ items: [clusterDateItem('2021-01-01')] })
    await expectIsValid({ label: clusterDateLabel })
  }, 30000)

  test('Enter Plot 1 values', async () => enterValuesPlot({ items: plots[0] }), 40000)

  test('Enter Plot 2 values', async () => enterValuesPlot({ items: plots[1] }), 40000)

  test('Check Cluster values', async () => {
    await click('Cluster')
    await waitFor(1000)
    await checkValuesCluster({ items: ClusterItems })
  }, 40000)

  test('Check Plot 1 values', async () => checkValuesPlot({ id: 1, items: plots[0] }), 40000)

  test('Check Plot 2 values', async () => checkValuesPlot({ id: 2, items: plots[1] }), 40000)
})
