import { FormUtils } from '../utils/formUtils'
import {
  formatTime,
  getBooleanSelector,
  getCoordinateSelector,
  getNodeDefSelector,
  getTaxonSelector,
  getTextSelector,
  parseValue,
} from './utils'
import * as DateUtils from '../../../../core/dateUtils'

const verifyBoolean = async (nodeDef, value, parentSelector) => {
  const booleanRadioButton = await page.$(`${getBooleanSelector(nodeDef, parentSelector, value)}`)
  await expect(await booleanRadioButton.getAttribute('class')).toContain('Mui-checked')
}

const verifyCode = async (nodeDef, value, parentSelector) =>
  FormUtils.expectDropdownValue({
    parentSelector: getNodeDefSelector(nodeDef, parentSelector),
    value,
  })

const verifyCoordinate = async (nodeDef, value, parentSelector) => {
  const { xSelector, ySelector, srsTestId } = getCoordinateSelector(nodeDef, parentSelector)

  const x = await page.$(xSelector)
  const y = await page.$(ySelector)

  await expect(Number(await x.getAttribute('value'))).toBe(Number(value.x))
  await expect(Number(await y.getAttribute('value'))).toBe(Number(value.y))
  await FormUtils.expectDropdownValue({
    testId: srsTestId,
    parentSelector: getNodeDefSelector(nodeDef, parentSelector),
    value: value.srsLabel,
  })
}

const verifyDate = async (nodeDef, value, parentSelector) => {
  const nodeDefSelector = getNodeDefSelector(nodeDef, parentSelector)
  const inputField = await page.$(`${nodeDefSelector} input`)
  const inputFieldValue = await inputField.getAttribute('value')
  const dateFormatted = DateUtils.format(value)
  await expect(inputFieldValue).toBe(dateFormatted)
}

const verifyTaxon = async (nodeDef, value, parentSelector) => {
  const { codeSelector, scientificNameSelector, vernacularNameSelector } = getTaxonSelector(nodeDef, parentSelector)
  // A taxon default value (e.g. a default-value expression applied right after the node is added)
  // is filled in asynchronously, so the input can still be empty for a moment after the node
  // appears; wait for it to settle instead of reading it on the very first paint.
  await page.waitForFunction(
    ({ selector, expectedValue }) => document.querySelector(selector)?.value === expectedValue,
    { selector: codeSelector, expectedValue: value.code },
    { timeout: 5000 }
  )
  const code = await page.$(codeSelector)
  const scientificName = await page.$(scientificNameSelector)
  const vernacularName = await page.$(vernacularNameSelector)
  await expect(await code.getAttribute('value')).toBe(value.code)
  await expect(await scientificName.getAttribute('value')).toBe(value.scientificName)
  await expect(await vernacularName.getAttribute('value')).toBe(value.vernacularName)
}

const verifyText = async (nodeDef, value, parentSelector) => {
  const text = await page.$(getTextSelector(nodeDef, parentSelector))
  await expect(await text.getAttribute('value')).toBe(value)
}

const verifyTime = async (nodeDef, valueRegExpOrDate, parentSelector) => {
  const nodeDefSelector = getNodeDefSelector(nodeDef, parentSelector)
  const inputField = await page.$(`${nodeDefSelector} input`)
  const inputFieldValue = await inputField.getAttribute('value')
  if (typeof valueRegExpOrDate === 'string') {
    await expect(inputFieldValue).toMatch(new RegExp(valueRegExpOrDate))
  } else {
    const timeFormatted = formatTime(valueRegExpOrDate)
    await expect(inputFieldValue).toBe(timeFormatted)
  }
}

const verifyFns = {
  boolean: verifyBoolean,
  code: verifyCode,
  coordinate: verifyCoordinate,
  date: verifyDate,
  decimal: verifyText,
  integer: verifyText,
  taxon: verifyTaxon,
  text: verifyText,
  time: verifyTime,
}

export const verifyAttribute = (nodeDef, value, parentSelector = '') =>
  test(`Verify ${nodeDef.name} value`, async () => {
    await verifyFns[nodeDef.type](nodeDef, parseValue(value), parentSelector)
  })
