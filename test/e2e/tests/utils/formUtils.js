import { Objects } from '@openforis/arena-core'

import { TestId, getSelector } from '../../../../webapp/utils/testId'

const getDropdownSelector = ({ testId = null, parentSelector = '' }) =>
  `${parentSelector} ${testId ? getSelector(testId, '.dropdown-wrapper') : '.dropdown-wrapper'} .dropdown`

const getDropdownValueSelector = ({ testId = null, parentSelector = '' }) =>
  `${getDropdownSelector({ testId, parentSelector })} .dropdown__single-value`

const selectDropdownItem = async ({ testId = null, parentSelector = '', value = null, label = null }) => {
  const dropdownSelector = getDropdownSelector({ testId, parentSelector })
  const inputSelector = `${dropdownSelector} .dropdown__input`

  if (await page.isEditable(inputSelector)) {
    // wait for dropdown items to be ready
    await page.waitForTimeout(200)

    // open dropdown menu
    const toggleBtnSelector = `${dropdownSelector} .dropdown__indicator`
    await page.locator(toggleBtnSelector).last().click()
    if (value) {
      // select dropdown option by test id
      await page.click(getSelector(TestId.dropdown.dropDownItem(value)))
    } else if (label) {
      // select dropdown option by label
      const itemSelector = `.dropdown-option__label:has-text("${label}")`
      const itemEl = await page.$(itemSelector)
      await expect(itemEl).not.toBeNull()
      await page.click(itemSelector)
    }
  }
}

const expectDropdownToBeDisabled = async ({ testId = null, parentSelector = '' }) => {
  const selector = `${getDropdownSelector({ testId, parentSelector })}.dropdown--is-disabled`
  const dropdownEl = await page.$(selector)
  await expect(dropdownEl).not.toBeNull()
}

const expectDropdownValue = async ({ testId = null, parentSelector = '', value }) => {
  const dropdownValueEl = await page.$(getDropdownValueSelector({ testId, parentSelector }))
  if (Objects.isEmpty(value)) {
    await expect(dropdownValueEl).toBeNull()
  } else {
    await expect(dropdownValueEl).not.toBeNull()
    const dropdownValue = await dropdownValueEl.innerText()
    await expect(dropdownValue).toBe(value)
  }
}

const waitForLoaderToDisappear = async () => page.waitForSelector('.loader', { state: 'hidden', timeout: 5000 })

export const FormUtils = {
  selectDropdownItem,
  expectDropdownToBeDisabled,
  expectDropdownValue,
  waitForLoaderToDisappear,
}
