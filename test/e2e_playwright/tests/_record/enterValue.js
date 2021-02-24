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

const enterBoolean = async (nodeDef, value, parentSelector) =>
  page.click(getBooleanSelector(nodeDef, parentSelector, value))

const enterCode = async (nodeDef, value, parentSelector) => {
  // only dropdown for now
  const nodeDefSelector = getNodeDefSelector(nodeDef, parentSelector)
  const toggleBtnSelector = `${nodeDefSelector} ${getSelector(
    DataTestId.dropdown.toggleBtn(DataTestId.surveyForm.codeInputDropdown(nodeDef.name)),
    'button'
  )}`
  await page.click(toggleBtnSelector)
  await page.waitForSelector('.autocomplete-list')
  await page.click(`text="${value}"`)
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

  await page.fill(codeSelector, value.code.substring(0, 3))
  await page.waitForSelector('.autocomplete-list')
  await page.click(`text="${value.code}"`)
}

const enterText = async (nodeDef, value, parentSelector) => page.fill(getTextSelector(nodeDef, parentSelector), value)

const enterTime = async (nodeDef, value, parentSelector) => enterText(nodeDef, formatTime(value), parentSelector)

const enterValueFns = {
  boolean: enterBoolean,
  code: enterCode,
  coordinate: enterCoordinate,
  decimal: enterText,
  integer: enterText,
  taxon: enterTaxon,
  text: enterText,
  time: enterTime,
}

export const enterNodeValue = (nodeDef, value, parentSelector = '') =>
  test(`Enter ${nodeDef.name} value`, async () => {
    await enterValueFns[nodeDef.type](nodeDef, parseValue(value), parentSelector)
  })
