import { expect, Locator, Page } from '@playwright/test'

import { TestId } from '@webapp/utils/testId'

/**
 * Returns the (react-select based) dropdown with the specified test id, inside the specified container.
 * @param {Page | Locator} container - Page or element containing the dropdown.
 * @param {string | null} testId - Test id of the dropdown wrapper; if null, the first dropdown in the container is used.
 * @returns {Locator} - The dropdown locator.
 */
export const getDropdown = (container: Page | Locator, testId: string | null = null): Locator =>
  (testId ? container.locator(`.dropdown-wrapper[data-testid="${testId}"]`) : container.locator('.dropdown-wrapper'))
    .locator('.dropdown')
    .first()

const openDropdown = async (dropdown: Locator) => {
  const toggleBtn = dropdown.locator('.dropdown__indicator').last()
  await toggleBtn.scrollIntoViewIfNeeded()
  await toggleBtn.click()
}

/**
 * Selects the dropdown option with the specified value (option test id) or label.
 * @param {object} params - Parameters.
 * @param {Page} params.page - The page (dropdown menus are rendered in a portal).
 * @param {Locator} params.dropdown - The dropdown locator (see getDropdown).
 * @param {string} [params.value] - Option value.
 * @param {string} [params.label] - Option label.
 * @returns {Promise<void>} - Resolves when the option has been selected.
 */
export const selectDropdownItem = async ({
  page,
  dropdown,
  value,
  label,
}: {
  page: Page
  dropdown: Locator
  value?: string
  label?: string
}): Promise<void> => {
  await openDropdown(dropdown)
  const option = value
    ? page.getByTestId(TestId.dropdown.dropDownItem(value))
    : page.locator('.dropdown-option__label').filter({ hasText: label! }).first()
  await option.click()
}

/**
 * Checks that the dropdown shows the specified value (or no value, when the expected value is empty).
 * @param {Locator} dropdown - The dropdown locator.
 * @param {string} expectedLabel - Expected value label.
 * @returns {Promise<void>} - Resolves when the check completes.
 */
export const expectDropdownValue = async (dropdown: Locator, expectedLabel: string): Promise<void> => {
  const singleValue = dropdown.locator('.dropdown__single-value')
  if (expectedLabel) {
    await expect(singleValue).toHaveText(expectedLabel)
  } else {
    await expect(singleValue).toHaveCount(0)
  }
}
