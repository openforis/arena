import * as PromiseUtils from '@core/promiseUtils'

import { click, reload, waitFor } from '../api'

import { clickSiderbarBtnDataValidationReport } from './sidebar'
import { getTableRowsAsObjects } from './table'
import { enterValuesSequential } from './nodeDefs'

export const getValidationReportErrors = async () => {
  await reload()

  await waitFor(3000)
  await clickSiderbarBtnDataValidationReport()
  await waitFor(3000)

  const { rows, elements } = await getTableRowsAsObjects({
    rowSelector: '.table__row',
    headers: ['id', 'path', 'icon', 'message'],
  })
  return { rows, elements }
}

export const checkValidationReportErrors = async ({ expectedErrors }) => {
  const { rows: validationReportErrors } = await getValidationReportErrors()
  await expect(validationReportErrors.length).toBe(expectedErrors.length)
  await PromiseUtils.each(expectedErrors, async (expectedError, idx) => {
    await expect(validationReportErrors[idx].path).toBe(expectedError.path)
    await expect(validationReportErrors[idx].message).toBe(expectedError.message)
  })
}

export const enterValuesIntoValidationError = async ({ errorIndex, items }) => {
  const { elements } = await getValidationReportErrors()
  await click(elements[errorIndex])
  await enterValuesSequential({ items })
}
