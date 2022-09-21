import { Objects } from '@openforis/arena-core'

import { TestId, getSelector } from '../../../../webapp/utils/testId'

const getDropdownValueSelector = (parentSelector) => `${parentSelector} .dropdown__single-value`

const selectDropdownItem = async ({ testId, value = null, label = null, parentSelector = '' }) => {
  const inputSelector = `${parentSelector} ${getSelector(testId, 'input')}`
  if (await page.isEditable(inputSelector)) {
    const toggleBtnSelector = `${parentSelector} ${getSelector(TestId.dropdown.toggleBtn(testId))}`
    await page.click(toggleBtnSelector)
    if (value) {
      await page.click(getSelector(TestId.dropdown.dropDownItem(value)))
    } else if (label) {
      await page.click(`text="${label}"`)
    }
  }
}

const expectDropdownValue = async ({ parentSelector, value }) => {
  const dropdownValueEl = await page.$(getDropdownValueSelector(parentSelector))
  if (Objects.isEmpty(value)) {
    await expect(dropdownValueEl).toBeNull()
  } else {
    await expect(dropdownValueEl).not.toBeNull()
    const dropdownValue = await dropdownValueEl.innerText()
    await expect(dropdownValue).toBe(value)
  }
}

export const FormUtils = {
  getDropdownValueSelector,
  selectDropdownItem,
  expectDropdownValue,
}
