import * as NodeDef from '@core/survey/nodeDef'

import { selectSurvey } from '../utils/ui/survey'
import { checkValidationReportErrors, enterValuesIntoValidationError } from '../utils/ui/validationReportErrors'

describe('Check validation report', () => {
  test('Select survey', async () => selectSurvey())

  test('Open Validation report and expect 3 rows', async () => {
    const expectedErrors = [
      {
        path: 'Cluster[1] / Cluster decimal',
        message: 'cluster_decimal < 10',
      },
      {
        path: 'Cluster[2] / Cluster decimal',
        message: 'cluster_decimal < 20',
      },
      {
        path: 'Cluster[5] / Plot[] / Plot id',
        message: 'Required value',
      },
    ]
    await checkValidationReportErrors({ expectedErrors })
  }, 40000)

  test('Add 2 as plot id into the empty Plot id', async () => {
    const valuesToEnter = [{ type: NodeDef.nodeDefType.integer, value: 2, label: 'Plot id' }]
    await enterValuesIntoValidationError({ errorIndex: 2, items: valuesToEnter })
  }, 40000)

  test('Expect 4 errors', async () => {
    const expectedErrors = [
      {
        path: 'Cluster[1] / Cluster decimal',
        message: 'cluster_decimal < 10',
      },
      {
        path: 'Cluster[2] / Cluster decimal',
        message: 'cluster_decimal < 20',
      },
      {
        path: 'Cluster[5] / Plot[2] / Plot id',
        message: 'Duplicate entity key',
      },
      {
        path: 'Cluster[5] / Plot[2] / Plot id',
        message: 'Duplicate entity key',
      },
    ]
    await checkValidationReportErrors({ expectedErrors })
  }, 40000)

  test('Click second row and enter 3 intro plot id value', async () => {
    const valuesToEnter = [{ type: NodeDef.nodeDefType.integer, value: 3, label: 'Plot id' }]
    await enterValuesIntoValidationError({ errorIndex: 3, items: valuesToEnter })
  }, 40000)

  test('Validation report and expect 2 rows', async () => {
    const expectedErrors = [
      {
        path: 'Cluster[1] / Cluster decimal',
        message: 'cluster_decimal < 10',
      },
      {
        path: 'Cluster[2] / Cluster decimal',
        message: 'cluster_decimal < 20',
      },
    ]
    await checkValidationReportErrors({ expectedErrors })
  }, 40000)

  test('Click second row and enter 11 to fix error', async () => {
    const valuesToEnter = [{ type: NodeDef.nodeDefType.decimal, value: 11, label: 'Cluster decimal' }]
    await enterValuesIntoValidationError({ errorIndex: 1, items: valuesToEnter })
  }, 40000)

  test('Validation report and expect 1 rows', async () => {
    const expectedErrors = [
      {
        path: 'Cluster[1] / Cluster decimal',
        message: 'cluster_decimal < 10',
      },
    ]
    await checkValidationReportErrors({ expectedErrors })
  }, 40000)
})
