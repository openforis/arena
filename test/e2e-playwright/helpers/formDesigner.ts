import { expect, Locator, Page, Response } from '@playwright/test'

import { TestId } from '@webapp/utils/testId'

import { getDropdown, selectDropdownItem } from './dropdown'
import { Urls } from './urls'

export type NodeDefDetails = {
  name: string
  label: string
  key?: boolean
  multiple?: boolean
  unique?: boolean
}

/**
 * Helper to edit the survey schema in the form designer.
 */
export class FormDesigner {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto(Urls.formDesigner)
    await expect(this.surveyForm).toBeVisible()
    // wait for the route loader overlay to go away (it would intercept the mouse)
    await expect(this.page.locator('.loader__boxes')).toHaveCount(0)
  }

  get surveyForm(): Locator {
    return this.page.getByTestId(TestId.surveyForm.surveyForm)
  }

  nodeDefWrapper(name: string): Locator {
    return this.page.getByTestId(TestId.surveyForm.nodeDefWrapper(name)).first()
  }

  errorBadge(name: string): Locator {
    return this.page.getByTestId(TestId.surveyForm.nodeDefErrorBadge(name))
  }

  /**
   * Moves the mouse over the node def, to make its edit buttons appear.
   * @param {string} name - Node def name.
   * @returns {Promise<void>} - Resolves when the mouse has been moved.
   */
  private async hoverNodeDef(name: string): Promise<void> {
    const wrapper = this.nodeDefWrapper(name)
    await wrapper.scrollIntoViewIfNeeded()
    const box = (await wrapper.boundingBox())!
    await this.page.mouse.move(box.x + 2, box.y + 2)
    await this.page.mouse.move(box.x + box.width / 2, box.y + Math.min(box.height / 2, 20), { steps: 2 })
  }

  async addChild(parentName: string, type: string): Promise<void> {
    await this.hoverNodeDef(parentName)
    await this.page.getByTestId(TestId.surveyForm.nodeDefAddChildToBtn(parentName)).click()
    await this.page.getByTestId(TestId.surveyForm.nodeDefAddChildOfTypeBtn(type)).click()
    await expect(this.nameInput).toBeVisible()
  }

  async addSubPage(): Promise<void> {
    await this.page.getByTestId(TestId.surveyForm.addSubPageBtn).click()
    await expect(this.nameInput).toBeVisible()
  }

  async edit(name: string): Promise<void> {
    await this.hoverNodeDef(name)
    await this.page.getByTestId(TestId.surveyForm.nodeDefEditBtn(name)).click()
    await expect(this.nameInput).toBeVisible()
  }

  async gotoPage(nodeDefName: string): Promise<void> {
    await this.page
      .getByTestId(TestId.surveyForm.pageLinkBtn(nodeDefName))
      .locator('.MuiTreeItem-label')
      .first()
      .click()
  }

  // ===== node def details

  get nameInput(): Locator {
    return this.page.locator(`input[data-testid="${TestId.nodeDefDetails.nodeDefName}"]`)
  }

  async gotoTab(tab: string): Promise<void> {
    await this.page.getByTestId(TestId.tabBar.tabBarBtn(tab)).click()
  }

  async fillDetails({ name, label, key, multiple, unique }: NodeDefDetails): Promise<void> {
    await this.nameInput.fill(name)
    await this.page.locator(`input[data-testid="${TestId.nodeDefDetails.nodeDefLabels()}"]`).fill(label)
    if (key) await this.check(TestId.nodeDefDetails.nodeDefKey)
    if (multiple) await this.check(TestId.nodeDefDetails.nodeDefMultiple)
    if (unique) {
      await this.gotoTab(TestId.nodeDefDetails.validations)
      await this.check(TestId.nodeDefDetails.nodeDefUnique)
      await this.gotoTab(TestId.nodeDefDetails.basic)
    }
  }

  /**
   * Adds (or edits) an expression of the node def being edited.
   * @param {object} params - Parameters.
   * @param {string} params.qualifier - Expression type (e.g. TestId.nodeDefDetails.defaultValues).
   * @param {number} [params.index] - Index of the expression (when the property allows multiple expressions).
   * @param {string} params.expression - Expression (or literal value, when using the basic editor).
   * @param {'advanced' | 'boolean' | 'dropdown'} [params.editor] - Editor to use: advanced (code editor) or
   * basic (boolean value or literal value dropdown).
   * @param {string} [params.applyIf] - Optional "apply if" expression (entered with the advanced editor).
   * @returns {Promise<void>} - Resolves when the expression has been applied.
   */
  async editExpression({
    qualifier,
    index = 0,
    expression,
    editor = 'advanced',
    applyIf,
  }: {
    qualifier: string
    index?: number
    expression: string
    editor?: 'advanced' | 'boolean' | 'dropdown'
    applyIf?: string
  }): Promise<void> {
    const definedRadio = this.page.getByTestId(TestId.expressionEditor.modeRadio(qualifier, 'defined'))
    if (await definedRadio.isVisible()) await definedRadio.click()

    const editBtn = this.page.getByTestId(TestId.expressionEditor.editBtn(qualifier, index))
    if (await editBtn.isVisible()) {
      await editBtn.click()
    } else {
      await this.page.getByTestId(TestId.expressionEditor.newBtn(qualifier)).click()
    }
    if (editor === 'advanced') {
      await this.typeAdvancedExpression(expression)
    } else if (editor === 'boolean') {
      await this.page.locator('.expression-editor-popup').getByText(expression, { exact: true }).click()
    } else {
      await selectDropdownItem({
        page: this.page,
        dropdown: getDropdown(this.page, TestId.expressionEditor.literalDropdown),
        value: expression,
      })
    }
    await this.page.getByTestId(TestId.expressionEditor.applyBtn).click()

    if (applyIf) {
      await this.page
        .getByTestId(TestId.expressionEditor.editBtn(TestId.nodeDefDetails.applyIf(qualifier), index))
        .click()
      await this.typeAdvancedExpression(applyIf)
      await this.page.getByTestId(TestId.expressionEditor.applyBtn).click()
    }
  }

  private async typeAdvancedExpression(expression: string): Promise<void> {
    await this.page.getByTestId(TestId.expressionEditor.toggleModeBtn).click()
    const codeEditor = this.page.locator('.expression-editor-popup .cm-content')
    await codeEditor.click()
    await codeEditor.pressSequentially(expression)
    // close the autocompletion popup, if open
    await this.page.keyboard.press('Escape')
    await expect(codeEditor).toHaveText(expression)
  }

  /**
   * Checks the (MUI) checkbox with the specified test id, if not checked already
   * (e.g. entities displayed in their own page are always multiple).
   * @param {string} testId - Checkbox test id.
   * @returns {Promise<void>} - Resolves when the checkbox is checked.
   */
  private async check(testId: string): Promise<void> {
    const checkbox = this.page.getByTestId(testId)
    if (!/Mui-checked/.test((await checkbox.getAttribute('class')) ?? '')) await checkbox.click()
    await expect(checkbox).toHaveClass(/Mui-checked/)
  }

  /**
   * Saves the node def being edited and goes back to the form designer.
   * @param {string} label - Label of the node def (it is expected to be shown in the form after saving).
   * @returns {Promise<void>} - Resolves when back in the form designer.
   */
  async saveAndBack(label: string): Promise<void> {
    const isNodeDefSaveResponse = (response: Response) =>
      ['POST', 'PUT'].includes(response.request().method()) && /\/nodeDefs?(\/|$)/.test(response.url()) && response.ok()
    const saveAndBackBtn = this.page.getByTestId(TestId.nodeDefDetails.saveAndBackBtn)
    if (await saveAndBackBtn.isVisible()) {
      await Promise.all([this.page.waitForResponse(isNodeDefSaveResponse), saveAndBackBtn.click()])
    } else {
      await Promise.all([
        this.page.waitForResponse(isNodeDefSaveResponse),
        this.page.getByTestId(TestId.nodeDefDetails.saveBtn).click(),
      ])
      await this.page.getByTestId(TestId.nodeDefDetails.backBtn).click()
    }
    await expect(this.page).toHaveURL(new RegExp(`${Urls.formDesigner}$`))
    await expect(this.surveyForm.getByText(label, { exact: true }).first()).toBeVisible()
  }

  async addChildWithDetails(parentName: string, type: string, details: NodeDefDetails): Promise<void> {
    await this.addChild(parentName, type)
    await this.fillDetails(details)
    await this.saveAndBack(details.label)
  }

  /**
   * Returns the names of the children of the specified entity, in the order they are displayed.
   * @param {string} entityName - Entity name.
   * @returns {Promise<string[]>} - Child names.
   */
  async childNames(entityName: string): Promise<string[]> {
    const entity = this.page.locator(`[data-node-def-name="${entityName}"]`)
    return ((await entity.getAttribute('data-child-names')) ?? '').split(',')
  }
}
