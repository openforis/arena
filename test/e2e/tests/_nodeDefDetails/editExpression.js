import { TestId, getSelector } from '../../../../webapp/utils/testId'
import { FormUtils } from '../utils/formUtils'
import { persistNodeDefChanges } from './editDetails'

const advancedTextEditorSelector = '.cm-content'

const editAdvanced = async (expressionStr) => {
  await page.click(getSelector(TestId.expressionEditor.toggleModeBtn, 'button'))
  // wait for codemirror to initialize
  await page.waitForTimeout(500)

  await page.waitForSelector(advancedTextEditorSelector)
  const textEditorLocator = page.locator(advancedTextEditorSelector)
  await textEditorLocator.click()
  for (const char of expressionStr) {
    await textEditorLocator.press(char)
  }
}

const editBoolean = async (expressionStr) => page.click(`text="${expressionStr}"`)

const editDropdown = async (expressionStr) => {
  await FormUtils.selectDropdownItem({ testId: TestId.expressionEditor.literalDropdown, value: expressionStr })
  await expect(page).toHaveText(expressionStr)
}

const editFns = {
  boolean: editBoolean,
  code: editDropdown,
  taxon: editDropdown,
}

export const editNodeDefExpression = (nodeDef, expressions) => {
  expressions.forEach((expression, idx) => {
    const { type: qualifier } = expression
    test(`${nodeDef.label} edit expression "${expression.expression}"`, async () => {
      if (idx === 0) {
        // goto tab
        const tab =
          TestId.nodeDefDetails.validations === qualifier
            ? TestId.nodeDefDetails.validations
            : TestId.nodeDefDetails.advanced
        await page.click(getSelector(TestId.tabBar.tabBarBtn(tab), 'button'))
      }

      // goto expression editor
      const modeRadioDefinedLocator = page.locator(getSelector(TestId.expressionEditor.modeRadio(qualifier, 'defined')))
      if (await modeRadioDefinedLocator.isVisible()) {
        await modeRadioDefinedLocator.click()
      }
      const editButtonLocator = page.locator(getSelector(TestId.expressionEditor.editBtn(qualifier, idx), 'button'))
      if (await editButtonLocator.isVisible()) {
        // edit existing expression
        await editButtonLocator.click()
      } else {
        // add new expression
        const newBtnLocator = page.locator(getSelector(TestId.expressionEditor.newBtn(qualifier), 'button'))
        await newBtnLocator.click()
      }
      const editFn = editFns[nodeDef.type] || editAdvanced
      await editFn(expression.expression)

      await page.click(getSelector(TestId.expressionEditor.applyBtn, 'button'))
    })

    if (expression.applyIf) {
      test(`${nodeDef.label} edit expression ${expression.expression} applyIf ${expression.applyIf}`, async () => {
        const btnId = TestId.expressionEditor.editBtn(TestId.nodeDefDetails.applyIf(expression.type), idx)
        const buttonLocator = page.locator(getSelector(btnId, 'button'))
        await buttonLocator.click()

        await editAdvanced(expression.applyIf)

        await page.click(getSelector(TestId.expressionEditor.applyBtn, 'button'))
      })
    }
  })

  persistNodeDefChanges(nodeDef)
}
