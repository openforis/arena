import * as DateUtils from '../../../../core/dateUtils'
import { nodeDefType } from '../../../../core/survey/nodeDefType'

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

const getRemainingTimeoutMs = (deadlineMs) => deadlineMs - Date.now()
const minOperationTimeoutMs = 50

const getRemainingTimeoutMsOrThrow = (deadlineMs, operation) => {
  const remainingTimeoutMs = getRemainingTimeoutMs(deadlineMs)
  if (remainingTimeoutMs < minOperationTimeoutMs) {
    throw new Error(`enterAttribute attempt timed out waiting for ${operation}`)
  }
  return remainingTimeoutMs
}

const waitForTextInputToBeEditable = async (selector, deadlineMs) => {
  await page.waitForSelector(selector, {
    state: 'visible',
    timeout: getRemainingTimeoutMsOrThrow(deadlineMs, 'text input to become visible'),
  })
  await page.waitForFunction(
    (inputSelector) => {
      const input = document.querySelector(inputSelector)
      return Boolean(input) && !input.disabled && !input.readOnly
    },
    selector,
    { timeout: getRemainingTimeoutMsOrThrow(deadlineMs, 'text input to become editable') }
  )
}

const enterText = async (nodeDef, value, parentSelector, { timeout } = {}) => {
  const selector = getTextSelector(nodeDef, parentSelector)
  if (timeout) {
    const deadlineMs = Date.now() + timeout
    await waitForTextInputToBeEditable(selector, deadlineMs)
    await page.fill(selector, value, {
      timeout: getRemainingTimeoutMsOrThrow(deadlineMs, 'text input fill'),
    })
  } else {
    await page.fill(selector, value)
  }
}

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

// Keep the total retry budget implied by these constants well below the 15 s enterAttribute test
// timeout so failed attempts still have several seconds left for lock-toggle, retry, and
// error-handling overhead before Jest aborts the test.
const KEY_FIELD_RETRY_ATTEMPTS = 2
const KEY_FIELD_ATTEMPT_TIMEOUT_MS = 4000

const unlockKeyFieldIfNeeded = async (nodeDef, parentSelector) => {
  if (!nodeDef.key) return
  const keyToggleSelector = `${parentSelector} ${getSelector(TestId.surveyForm.keyLockToggle(nodeDef.name), 'button')}`
  const keyToggleLocator = page.locator(keyToggleSelector)
  if (await keyToggleLocator.isVisible()) {
    const keyToggleAriaLabel = await keyToggleLocator.getAttribute('aria-label')
    if (keyToggleAriaLabel?.toLowerCase().includes('allow')) {
      await keyToggleLocator.click()
      await page.keyboard.press('Escape') // close potential tooltip
    }
  }
}

// Types whose enter function is a plain, idempotent fill: safe to retry from scratch if an
// attempt hangs, unlike e.g. code/time which drive a stateful dropdown/picker that a second,
// overlapping invocation could leave open or half-interacted with.
const simpleFillTypes = [nodeDefType.decimal, nodeDefType.integer, nodeDefType.text]

export const enterAttribute = (nodeDef, value, parentSelector = '') =>
  test(`Enter ${nodeDef.name} value`, async () => {
    const enterValue = (timeout) => enterFns[nodeDef.type](nodeDef, parseValue(value), parentSelector, { timeout })

    if (nodeDef.key && simpleFillTypes.includes(nodeDef.type)) {
      // Key fields start locked once they hold a value and only unlock for the current focus
      // session (see useAttributeFieldLock in webapp/.../nodeDefSwitch.js). The unlock check
      // above is a single, non-retried isVisible() snapshot: if an async validation update
      // (triggered by a sibling row's duplicate-key edit) re-renders this field's lock toggle
      // between that check and the fill, the toggle can be missed and the fill is left racing a
      // disabled input that never becomes enabled, hanging until the test timeout (seen in CI,
      // e.g. https://github.com/openforis/arena/actions/runs/34883644236). Retry the whole
      // unlock+fill sequence a few times with a short per-attempt budget, the same way
      // enterTaxon above already retries around a similar record-update race.
      let lastError
      for (let attempt = 0; attempt < KEY_FIELD_RETRY_ATTEMPTS; attempt += 1) {
        try {
          await unlockKeyFieldIfNeeded(nodeDef, parentSelector)
          await enterValue(KEY_FIELD_ATTEMPT_TIMEOUT_MS)
          lastError = null
          break
        } catch (e) {
          lastError = e
        }
      }
      if (lastError) throw lastError
    } else {
      // Non-idempotent key widgets (e.g. code/time pickers) still unlock once if needed, but do
      // not retry: repeating those interactions mid-update can leave dropdowns or pickers open and
      // make the flake worse instead of better.
      await unlockKeyFieldIfNeeded(nodeDef, parentSelector)
      await enterValue()
    }

    await FormUtils.waitForHeaderLoaderToDisappear()
  }, 15000)
