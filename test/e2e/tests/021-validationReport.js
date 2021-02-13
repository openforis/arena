import * as NodeDef from '@core/survey/nodeDef'

import { selectSurvey } from '../utils/ui/survey'
import { checkValidationReportErrors, enterValuesIntoValidationError } from '../utils/ui/validationReportErrors'

describe('Check validation report', () => {
  test('Select survey', async () => selectSurvey())

  test('Open Validation report and expect 3 rows', async () => {
    const expectedErrors = [
      {
        path: 'Cluster[5] / Plot[] / Plot id',
        message: 'Required value',
      },
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
  })

  test('Add 2 as plot id into the empty Plot id and add a new error', async () => {
    const valuesToEnter = [{ type: NodeDef.nodeDefType.integer, value: 2, label: 'Plot id' }]
    await enterValuesIntoValidationError({ errorIndex: 0, items: valuesToEnter })

    const expectedErrors = [
      {
        path: 'Cluster[5] / Plot[2] / Plot id',
        message: 'Duplicate entity key',
      },
      {
        path: 'Cluster[5] / Plot[2] / Plot id',
        message: 'Duplicate entity key',
      },
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
  })

  test('Click second row and enter 3 intro plot id value', async () => {
    const valuesToEnter = [{ type: NodeDef.nodeDefType.integer, value: 3, label: 'Plot id' }]
    await enterValuesIntoValidationError({ errorIndex: 1, items: valuesToEnter })
  })

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
  })

  test('Click second row and enter 11 to fix error', async () => {
    const valuesToEnter = [{ type: NodeDef.nodeDefType.decimal, value: 11, label: 'Cluster decimal' }]
    await enterValuesIntoValidationError({ errorIndex: 1, items: valuesToEnter })
  })

  test('Validation report and expect 1 rows', async () => {
    const expectedErrors = [
      {
        path: 'Cluster[1] / Cluster decimal',
        message: 'cluster_decimal < 10',
      },
    ]
    await checkValidationReportErrors({ expectedErrors })
  })
})
