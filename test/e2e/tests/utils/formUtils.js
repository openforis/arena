import { Objects } from '@openforis/arena-core'

import { TestId, getSelector } from '../../../../webapp/utils/testId'

const getDropdownSelector = ({ testId, parentSelector = '' }) =>
  `${parentSelector} ${getSelector(testId, '.dropdown-wrapper')} .dropdown`

const getDropdownValueSelector = ({ testId, parentSelector }) =>
  `${getDropdownSelector({ testId, parentSelector })} .dropdown__single-value`

const selectDropdownItem = async ({ testId, value = null, label = null, parentSelector = '' }) => {
  const dropdownSelector = getDropdownSelector({ testId, parentSelector })
  const inputSelector = `${dropdownSelector} .dropdown__input`
  if (await page.isEditable(inputSelector)) {
    const toggleBtnSelector = `${dropdownSelector} .dropdown__indicator`
    await page.click(toggleBtnSelector)
    if (value) {
      await page.click(getSelector(TestId.dropdown.dropDownItem(value)))
    } else if (label) {
      await page.click(`text="${label}"`)
    }
  }
}

const expectDropdownToBeDisabled = async ({ testId, parentSelector = '' }) => {
  const dropdownValueEl = await page.$(getDropdownSelector({ testId, parentSelector }))
  await expect(dropdownValueEl).not.toBeNull()
  await expect(dropdownValueEl).toHaveClass('dropdown--is-disabled')
}

const expectDropdownValue = async ({ testId, parentSelector = '', value }) => {
  const dropdownValueEl = await page.$(getDropdownValueSelector({ testId, parentSelector }))
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
  expectDropdownToBeDisabled,
  expectDropdownValue,
}
