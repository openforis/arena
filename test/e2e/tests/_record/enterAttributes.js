import { DataTestId, getSelector } from '../../../../webapp/utils/dataTestId'
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
    DataTestId.dropdown.toggleBtn(DataTestId.surveyForm.codeInputDropdown(nodeDef.name)),
    'button'
  )}`
  await page.click(toggleBtnSelector)
  const itemEl = await page.waitForSelector(`text="${value}"`)
  await itemEl.click()
}

const enterCoordinate = async (nodeDef, value, parentSelector) => {
  const { xSelector, ySelector, srsSelector } = getCoordinateSelector(nodeDef, parentSelector)

  await page.fill(xSelector, value.x)
  await page.fill(ySelector, value.y)
  await page.focus(srsSelector)
  await page.click(getSelector(DataTestId.dropdown.dropDownItem(value.srs)))
}

const enterTaxon = async (nodeDef, value, parentSelector) => {
  const { codeSelector } = getTaxonSelector(nodeDef, parentSelector)

  const fillCodeAndSelectItem = async () => {
    try {
      await page.fill(codeSelector, value.code.substring(0, 3))
      await page.waitForSelector('.autocomplete-list', { timeout: 5000 })
      await page.click(`text="${value.scientificName}"`)
      return true
    } catch (e) {
      return false
    }
  }
  // try to fill the code and select an item from the autocomplete 2 times:
  // autocomplete dialog could have been closed after record update
  ;[...new Array(2).keys()].some(async () => fillCodeAndSelectItem())
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
  })
