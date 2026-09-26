import { expect, Locator, Page } from '@playwright/test'

import * as DateUtils from '@core/dateUtils'
import { TestId } from '@webapp/utils/testId'

import { expectDropdownValue, getDropdown, selectDropdownItem } from './dropdown'

export type CoordinateValue = { x: string; y: string; srs: string; srsLabel?: string }
export type TaxonValue = { code: string; scientificName: string; vernacularName?: string }

export type AttributeValue = string | CoordinateValue | TaxonValue

type AttributeDef = { name: string; type: string; key?: boolean }

export const srsLabels: Record<string, string> = { '4326': 'WGS 1984 (EPSG:4326)' }

/**
 * Helper to enter and verify attribute values in the record (or form preview) editor.
 * Values are expressed as displayed in the form: dates as DD/MM/YYYY, times as HH:mm, codes as "label (code)".
 */
export class RecordForm {
  constructor(private readonly page: Page) {}

  nodeDefWrapper(name: string, parent?: Locator): Locator {
    return (parent ?? this.page).getByTestId(TestId.surveyForm.nodeDefWrapper(name)).first()
  }

  treeRow(entityName: string, idx: number): Locator {
    return this.page.getByTestId(TestId.surveyForm.entityRowData(entityName, idx))
  }

  errorBadge(name: string, parent?: Locator): Locator {
    return (parent ?? this.page).getByTestId(TestId.surveyForm.nodeDefErrorBadge(name))
  }

  async waitForHeaderLoader(): Promise<void> {
    await expect(this.page.locator('.app-header__loader-wrapper')).toBeHidden({ timeout: 15_000 })
  }

  private async unlockKeyAttribute(def: AttributeDef, parent?: Locator): Promise<void> {
    const toggle = (parent ?? this.page).getByTestId(TestId.surveyForm.keyLockToggle(def.name))
    if (!(await toggle.isVisible())) return
    const ariaLabel = (await toggle.getAttribute('aria-label')) ?? ''
    if (!ariaLabel.toLowerCase().includes('allow')) return
    // the toggle shows a tooltip that can intercept the pointer
    // eslint-disable-next-line playwright/no-force-option
    await toggle.click({ force: true })
    await this.page.keyboard.press('Escape')
  }

  /**
   * Enters the specified value and waits for it to be persisted.
   * (Values are persisted asynchronously, some of them after a debounce: leaving the page before that would lose them.)
   * @param {AttributeDef} def - The attribute definition.
   * @param {AttributeValue} value - The value to enter.
   * @param {Locator} [parent] - Container of the attribute (e.g. an entity table row).
   * @returns {Promise<void>} - Resolves when the value has been persisted.
   */
  async enter(def: AttributeDef, value: AttributeValue, parent?: Locator): Promise<void> {
    if (def.key) await this.unlockKeyAttribute(def, parent)
    const persisted = this.waitForNodePersist()
    const changed = await this.setValue(def, value, parent)
    if (changed) await persisted
    await this.waitForHeaderLoader()
  }

  private waitForNodePersist(): Promise<unknown> {
    const promise = this.page.waitForResponse(
      (response) => response.request().method() === 'POST' && /\/record\/[\w-]+\/node$/.test(response.url()),
      { timeout: 15_000 }
    )
    // avoid unhandled rejections when the value doesn't change (no request is sent)
    promise.catch(() => {})
    return promise
  }

  private async setValue(def: AttributeDef, value: AttributeValue, parent?: Locator): Promise<boolean> {
    const wrapper = this.nodeDefWrapper(def.name, parent)
    switch (def.type) {
      case 'boolean': {
        const option = wrapper.locator(`.MuiButtonBase-root[data-value="${value as string}"]`)
        if (((await option.getAttribute('class')) ?? '').includes('Mui-checked')) return false
        await option.click()
        break
      }
      case 'code':
        await selectDropdownItem({ page: this.page, dropdown: getDropdown(wrapper), label: value as string })
        break
      case 'coordinate': {
        const { x, y, srs } = value as CoordinateValue
        await wrapper.locator(`input[data-testid="${TestId.surveyForm.coordinateX(def.name)}"]`).fill(x)
        await wrapper.locator(`input[data-testid="${TestId.surveyForm.coordinateY(def.name)}"]`).fill(y)
        const srsDropdown = getDropdown(wrapper, TestId.surveyForm.coordinateSRS(def.name))
        if (await srsDropdown.locator('.dropdown__input').isEditable()) {
          await selectDropdownItem({ page: this.page, dropdown: srsDropdown, value: srs })
        }
        break
      }
      case 'date':
        await wrapper.locator('input').fill(value as string)
        break
      case 'taxon': {
        const { code } = value as TaxonValue
        const codeInput = wrapper.locator(`input[data-testid="${TestId.surveyForm.taxonField(def.name, 'code')}"]`)
        await codeInput.fill(code.substring(0, 3))
        await this.page.locator('.autocomplete-list').getByText(code, { exact: true }).click()
        break
      }
      case 'time':
        await this.enterTime(wrapper, value as string)
        break
      default: {
        const input = wrapper.locator('input[type="text"]')
        await expect(input).toBeEnabled()
        if ((await input.inputValue()) === value) return false
        await input.fill(value as string)
      }
    }
    return true
  }

  private async enterTime(wrapper: Locator, value: string): Promise<void> {
    const [hours, minutes] = value.split(':').map(Number)
    await wrapper.locator('button.MuiIconButton-edgeEnd').click()
    const picker = this.page.locator('.MuiPickersLayout-root')
    await expect(picker).toBeVisible()
    for (const [key, partValue] of [
      ['hours', hours],
      ['minutes', minutes],
    ] as const) {
      const option = picker.locator(`li[aria-label="${partValue} ${key}"]`)
      await option.scrollIntoViewIfNeeded()
      await option.click()
    }
    const okBtn = this.page.locator('.MuiDialogActions-root').getByRole('button', { name: 'OK' })
    if (await okBtn.isVisible()) await okBtn.click()
  }

  async verify(def: AttributeDef, value: AttributeValue | RegExp, parent?: Locator): Promise<void> {
    const wrapper = this.nodeDefWrapper(def.name, parent)
    switch (def.type) {
      case 'boolean':
        await expect(wrapper.locator(`.MuiButtonBase-root[data-value="${value as string}"]`)).toHaveClass(/Mui-checked/)
        break
      case 'code': {
        const dropdown = getDropdown(wrapper)
        if (await dropdown.count()) {
          await expectDropdownValue(dropdown, value as string)
        } else {
          await expect(wrapper.locator('.value-preview')).toHaveText(value as string)
        }
        break
      }
      case 'coordinate': {
        const { x, y, srs, srsLabel } = value as CoordinateValue
        const xInput = wrapper.locator(`input[data-testid="${TestId.surveyForm.coordinateX(def.name)}"]`)
        const yInput = wrapper.locator(`input[data-testid="${TestId.surveyForm.coordinateY(def.name)}"]`)
        if (x) await expect.poll(async () => Number(await xInput.inputValue())).toBe(Number(x))
        else await expect(xInput).toHaveValue('')
        if (y) await expect.poll(async () => Number(await yInput.inputValue())).toBe(Number(y))
        else await expect(yInput).toHaveValue('')
        await expectDropdownValue(
          getDropdown(wrapper, TestId.surveyForm.coordinateSRS(def.name)),
          srsLabel ?? srsLabels[srs]
        )
        break
      }
      case 'taxon': {
        const { code, scientificName, vernacularName = '' } = value as TaxonValue
        const field = (name: string) =>
          wrapper.locator(`input[data-testid="${TestId.surveyForm.taxonField(def.name, name)}"]`)
        await expect(field('code')).toHaveValue(code)
        await expect(field('scientificName')).toHaveValue(scientificName)
        await expect(field('vernacularName')).toHaveValue(vernacularName)
        break
      }
      case 'date':
      case 'time':
        await expect(wrapper.locator('input')).toHaveValue(value as string | RegExp)
        break
      default:
        await expect(wrapper.locator('input[type="text"]')).toHaveValue(value as string | RegExp)
    }
  }

  /**
   * Hovers the error badge of the specified attribute and checks that its tooltip contains the specified message.
   * @param {string} name - Node def name.
   * @param {string} message - Expected message.
   * @param {Locator} [parent] - Container of the attribute (e.g. an entity table row).
   * @returns {Promise<void>} - Resolves when the check completes.
   */
  async expectError(name: string, message: string, parent?: Locator): Promise<void> {
    await this.errorBadge(name, parent).hover()
    await expect(this.page.locator('.tooltip__message-error, .MuiTooltip-tooltip').getByText(message)).toBeVisible()
    await this.page.mouse.move(0, 0)
  }

  /**
   * Clicks the specified "add entity" button and waits for the new entity to be persisted.
   * Editing its attributes before that would make their persist requests race with the entity one
   * (the server would fail with a foreign key violation).
   * @param {Locator} addButton - The button that adds the entity.
   * @returns {Promise<void>} - Resolves when the new entity has been persisted.
   */
  async addEntity(addButton: Locator): Promise<void> {
    await Promise.all([
      this.page.waitForResponse(
        (response) => response.request().method() === 'POST' && /\/record\/[\w-]+\/node$/.test(response.url())
      ),
      addButton.click(),
    ])
  }

  async addFormEntity(): Promise<void> {
    await this.addEntity(this.page.getByTestId(TestId.entities.form.addNewNode))
  }

  async addTableEntity(entityName: string): Promise<void> {
    await this.addEntity(this.page.getByTestId(TestId.surveyForm.entityAddBtn(entityName)))
  }

  async gotoPage(nodeDefName: string): Promise<void> {
    await this.page
      .getByTestId(TestId.surveyForm.pageLinkBtn(nodeDefName))
      .locator('.MuiTreeItem-label')
      .first()
      .click()
  }

  /**
   * Selects the entity to edit in a multiple entity form page, by its key.
   * The selector is a native select, or a MUI Select when the experimental features are enabled.
   * @param {string} keyLabel - Label of the key attribute.
   * @param {string} keyValue - Value of the key attribute.
   * @returns {Promise<void>} - Resolves when the entity has been selected.
   */
  async selectEntity(keyLabel: string, keyValue: string): Promise<void> {
    const label = `${keyLabel}: ${keyValue}`
    const select = this.page.getByTestId(TestId.entities.form.nodeSelect)
    if ((await select.evaluate((el) => el.tagName)) === 'SELECT') {
      await select.selectOption({ label })
    } else if (!((await select.textContent()) ?? '').includes(label)) {
      await select.locator('[role="combobox"]').click()
      await this.page.getByRole('option', { name: label }).click()
    }
  }
}

export const formatDate = (dateStorage: string): string => {
  const [year, month, day] = dateStorage.split('-')
  return `${day}/${month}/${year}`
}

export const today = (): string => DateUtils.format(new Date(), 'DD/MM/YYYY')
