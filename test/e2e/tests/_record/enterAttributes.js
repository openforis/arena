import * as PromiseUtils from '../../../../core/promiseUtils'
import * as DateUtils from '../../../../core/dateUtils'

import { TestId } from '../../../../webapp/utils/testId'
import { FormUtils } from '../utils/formUtils'
import {
  formatTime,
  getBooleanSelector,
  getCoordinateSelector,
  getDateTimeCalendarBtnSelector,
  getDateTimeInputSelector,
  getNodeDefSelector,
  getTaxonSelector,
  getTextSelector,
  parseValue,
} from './utils'

const enterBoolean = async (nodeDef, value, parentSelector) => {
  // If the boolean is already checked, due to a default value with the same value we dont need to click
  const span = await page.$(`${getBooleanSelector(nodeDef, parentSelector, value)} span`)
  const currentClass = await span.getAttribute('class')
  if (!new RegExp('icon-radio-checked2').test(currentClass)) {
    await page.click(getBooleanSelector(nodeDef, parentSelector, value))
  }
}

const enterCode = async (nodeDef, value, parentSelector) => {
  // only dropdown for now
  const nodeDefSelector = getNodeDefSelector(nodeDef, parentSelector)
  await FormUtils.selectDropdownItem({
    testId: TestId.surveyForm.codeInputDropdown(nodeDef.name),
    label: value,
    parentSelector: nodeDefSelector,
  })
}

const enterCoordinate = async (nodeDef, value, parentSelector) => {
  const { xSelector, ySelector, srsTestId } = getCoordinateSelector(nodeDef, parentSelector)
  await page.fill(xSelector, value.x)
  await page.fill(ySelector, value.y)

  await FormUtils.selectDropdownItem({ testId: srsTestId, value: value.srs, parentSelector })
}

const enterDate = async (nodeDef, value, parentSelector) =>
  page.fill(getDateTimeInputSelector(nodeDef, parentSelector), DateUtils.format(value))

const enterTaxon = async (nodeDef, value, parentSelector) => {
  const { codeSelector } = getTaxonSelector(nodeDef, parentSelector)

  const fillCodeAndSelectItem = async () => {
    try {
      const timeout = 2000
      await page.fill(codeSelector, value.code.substring(0, 3), { timeout })
      await page.waitForSelector('.autocomplete-list', { timeout })
      await page.click(`text="${value.code}"`, { timeout })
      return true
    } catch (e) {
      return false
    }
  }
  // try to fill the code and select an item from the autocomplete 2 times:
  // autocomplete dialog could have been closed after record update
  let valueSet = false
  await PromiseUtils.each([...new Array(2).keys()], async () => {
    if (!valueSet) {
      if (await fillCodeAndSelectItem()) valueSet = true
    }
  })
  expect(valueSet).toBeTruthy()
}

const enterText = async (nodeDef, value, parentSelector) => page.fill(getTextSelector(nodeDef, parentSelector), value)

const enterTime = async (nodeDef, value, parentSelector) => {
  const timeFormatted = formatTime(value)
  const [hours, minutes] = timeFormatted.split(':')
  // open hours/minutes selector
  await page.click(getDateTimeCalendarBtnSelector(nodeDef, parentSelector))
  // select time
  await page.getByRole('option', { name: `${hours} hours` }).click()
  await page.getByRole('option', { name: `${minutes} minutes` }).click()
  // click ok button
  await page.getByRole('button', { name: 'OK' }).click()
}

const enterFns = {
  boolean: enterBoolean,
  code: enterCode,
  coordinate: enterCoordinate,
  date: enterDate,
  decimal: enterText,
  integer: enterText,
  taxon: enterTaxon,
  text: enterText,
  time: enterTime,
}

export const enterAttribute = (nodeDef, value, parentSelector = '') =>
  test(`Enter ${nodeDef.name} value`, async () => {
    await enterFns[nodeDef.type](nodeDef, parseValue(value), parentSelector)
  }, 30000)
