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
    const toggleBtnSelector = `${dropdownSelector} .dropdown__indicator`
    await page.click(toggleBtnSelector)
    if (value) {
      await page.click(getSelector(TestId.dropdown.dropDownItem(value)))
    } else if (label) {
      await page.click(`text="${label}"`)
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
