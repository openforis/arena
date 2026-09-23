import * as DateUtils from '../../../../core/dateUtils'

import { getSelector, TestId } from '../../../../webapp/utils/testId'
import { FormUtils } from '../utils/formUtils'
import {
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
  const booleanRadioButton = await page.$(`${getBooleanSelector(nodeDef, parentSelector, value)}`)
  const currentClass = await booleanRadioButton.getAttribute('class')
  if (!currentClass.includes('Mui-checked')) {
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
  for (let attempt = 0; attempt < 2 && !valueSet; attempt++) {
    if (await fillCodeAndSelectItem()) valueSet = true
  }
  expect(valueSet).toBeTruthy()
}

const enterText = async (nodeDef, value, parentSelector) => page.fill(getTextSelector(nodeDef, parentSelector), value)

const enterTime = async (nodeDef, value, parentSelector) => {
  // open hours/minutes selector
  const dateTimeCalendarBtnSelector = getDateTimeCalendarBtnSelector(nodeDef, parentSelector)
  const dateTimeCalendarBtnLocator = page.locator(dateTimeCalendarBtnSelector)
  expect(await dateTimeCalendarBtnLocator.isVisible()).toBeTruthy()
  await dateTimeCalendarBtnLocator.click()

  // select time using time picker
  const timePickerSelector = '.MuiPickersLayout-root'
  const timePickerLocator = page.locator(timePickerSelector)
  await expect(await timePickerLocator.isVisible()).toBeTruthy()

  const selectTimePart = async ({ key, value }) => {
    const optionLocator = page.locator(`${timePickerSelector} li[aria-label="${value} ${key}"]`)
    await optionLocator.scrollIntoViewIfNeeded()
    await expect(await optionLocator.isVisible()).toBeTruthy()
    await optionLocator.click()
  }

  await selectTimePart({ key: 'hours', value: value.getHours() })
  await selectTimePart({ key: 'minutes', value: value.getMinutes() })

  const okButtonLocator = page.locator('.MuiDialogActions-root button[text="OK"]')
  if ((await timePickerLocator.isVisible()) && (await okButtonLocator.isVisible())) {
    await okButtonLocator.click()
  }
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

export const enterAttribute = (nodeDef, value, parentSelector = '') => {
  const isKeyAttribute = Boolean(nodeDef.key)
  // Key fields need an unlock click first; keep a bit more budget for the React re-render
  // before Playwright can fill the (previously disabled) input.
  // Key attributes: waitFor(visible,5s) + toBeEnabled(5s) + fill + waitForHeaderLoader(5s) can
  // stack to >15 s on slow CI runners, so use 25 s to give a comfortable margin.
  // Non-key attributes: fill + waitForHeaderLoader(5s) — bumped to 15 s to match previous key budget.
  const testTimeoutMs = isKeyAttribute ? 25000 : 15000

  return test(
    `Enter ${nodeDef.name} value`,
    async () => {
      if (isKeyAttribute) {
        const keyToggleSelector = `${parentSelector} ${getSelector(TestId.surveyForm.keyLockToggle(nodeDef.name), 'button')}`
        const keyToggleLocator = page.locator(keyToggleSelector)
        if (await keyToggleLocator.isVisible()) {
          await keyToggleLocator.scrollIntoViewIfNeeded()
          const keyToggleAriaLabel = await keyToggleLocator.getAttribute('aria-label')
          if (keyToggleAriaLabel?.toLowerCase().includes('allow')) {
            // The toggle wraps itself in a MUI tooltip showing its own lock/unlock hint; Playwright's
            // click hovers first, which can pop that tooltip open right on top of the button and make
            // it intercept the click, hanging until the test timeout (seen consistently in CI, e.g.
            // https://github.com/openforis/arena/actions/runs/34883644236). force bypasses that
            // pointer-interception check; we already know exactly which button this is.
            // force also bypasses Playwright's "not obscured by another element" check entirely, so
            // it's just as happy to click the app's global route loader (Routes.js's <Loader />,
            // see Loader.scss's .loader__boxes and _formDesigner/index.js's "Expand tree table" fix
            // for the same overlay caught doing this to a resize handle) if that's still on top from
            // a recent navigation - the toggle never actually gets clicked, so the field stays
            // disabled and the toBeEnabled check below fails. Wait for it to be gone first.
            await page.waitForSelector('.loader__boxes', { state: 'detached', timeout: 5000 })
            await keyToggleLocator.click({ force: true })
            await page.keyboard.press('Escape') // close potential tooltip

            // Unlock flips the input from disabled → enabled asynchronously; wait before fill so we
            // don't burn the whole jest timeout on Playwright's actionability wait (seen on
            // validationReport tree_id row 3: https://github.com/openforis/arena/actions/runs/35232215668).
            if (['integer', 'decimal', 'text'].includes(nodeDef.type)) {
              const inputSelector = getTextSelector(nodeDef, parentSelector)
              await page.waitForSelector(inputSelector, { state: 'visible', timeout: 5000 })
              // (no optional chaining here: the function is serialized and evaluated in the page)
              await page.waitForFunction(
                (selector) => {
                  const el = document.querySelector(selector)
                  return !!el && !el.disabled
                },
                inputSelector,
                { timeout: 5000 }
              )
            }
          }
        }
      }
      await enterFns[nodeDef.type](nodeDef, parseValue(value), parentSelector)
      await FormUtils.waitForHeaderLoaderToDisappear()
    },
    testTimeoutMs
  )
}
