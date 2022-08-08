import { getSelector } from '../../../../webapp/utils/testId'

import {
  expectDropdownValue,
  formatDate,
  formatTime,
  getBooleanSelector,
  getCoordinateSelector,
  getNodeDefSelector,
  getTaxonSelector,
  getTextSelector,
  parseValue,
} from './utils'

const verifyBoolean = async (nodeDef, value, parentSelector) => {
  const span = await page.$(`${getBooleanSelector(nodeDef, parentSelector, value)} span`)
  await expect(await span.getAttribute('class')).toContain('icon-radio-checked2')
}

const verifyCode = async (nodeDef, value, parentSelector) => {
  await expectDropdownValue({ parentSelector: `${parentSelector} ${getNodeDefSelector(nodeDef)}`, value })
}

const verifyCoordinate = async (nodeDef, value, parentSelector) => {
  const { xSelector, ySelector, srsTestId } = getCoordinateSelector(nodeDef, parentSelector)

  const x = await page.$(xSelector)
  const y = await page.$(ySelector)

  await expect(Number(await x.getAttribute('value'))).toBe(Number(value.x))
  await expect(Number(await y.getAttribute('value'))).toBe(Number(value.y))
  await expectDropdownValue({
    parentSelector: `${getNodeDefSelector(nodeDef, parentSelector)} ${getSelector(srsTestId)}`,
    value: value.srsLabel,
  })
}

const verifyDate = async (nodeDef, value, parentSelector) => {
  const nodeDefSelector = getNodeDefSelector(nodeDef, parentSelector)
  const year = await page.$(`${nodeDefSelector} input.input-year`)
  const month = await page.$(`${nodeDefSelector} input.input-month`)
  const day = await page.$(`${nodeDefSelector} input.input-day`)
  const values = formatDate(value)
  await expect(await year.getAttribute('value')).toBe(values[0])
  await expect(await month.getAttribute('value')).toBe(values[1])
  await expect(await day.getAttribute('value')).toBe(values[2])
}

const verifyTaxon = async (nodeDef, value, parentSelector) => {
  const { codeSelector, scientificNameSelector, vernacularNameSelector } = getTaxonSelector(nodeDef, parentSelector)
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

const verifyTime = async (nodeDef, value, parentSelector) => {
  if (typeof value === 'string') {
    const text = await page.$(getTextSelector(nodeDef, parentSelector))
    await expect(await text.getAttribute('value')).toMatch(new RegExp(value))
  } else {
    await verifyText(nodeDef, formatTime(value), parentSelector)
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
