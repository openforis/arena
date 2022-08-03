import * as PromiseUtils from '../../../../core/promiseUtils'

import { TestId, getSelector } from '../../../../webapp/utils/testId'
import {
  formatTime,
  getBooleanSelector,
  getCoordinateSelector,
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
  const toggleBtnSelector = `${nodeDefSelector} ${getSelector(
    TestId.dropdown.toggleBtn(TestId.surveyForm.codeInputDropdown(nodeDef.name))
  )}`
  await page.click(toggleBtnSelector)
  const itemEl = await page.waitForSelector(`text="${value}"`)
  await itemEl.click()
}

const enterCoordinate = async (nodeDef, value, parentSelector) => {
  const { xSelector, ySelector, srsSelector } = getCoordinateSelector(nodeDef, parentSelector)

  await page.fill(xSelector, value.x)
  await page.fill(ySelector, value.y)
  if (await page.isEditable(srsSelector)) {
    await page.focus(srsSelector)
    await page.click(getSelector(TestId.dropdown.dropDownItem(value.srs)))
  }
}

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

const enterTime = async (nodeDef, value, parentSelector) => enterText(nodeDef, formatTime(value), parentSelector)

const enterFns = {
  boolean: enterBoolean,
  code: enterCode,
  coordinate: enterCoordinate,
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
