import { each } from '../../../../core/promiseUtils'
import { TestId, getSelector } from '../../../../webapp/utils/testId'
import { FormUtils } from '../utils/formUtils'
import { persistNodeDefChanges } from './editDetails'

const textEditorSelector = '.cm-activeLine'

const editAdvanced = async (expressionStr) => {
  await page.click(getSelector(TestId.expressionEditor.toggleModeBtn, 'button'))
  // wait for codemirror to initialize
  await page.waitForTimeout(500)

  await page.waitForSelector(textEditorSelector)
  const codeMirrorLocator = page.locator(textEditorSelector)
  await each(expressionStr, async (char) => {
    await codeMirrorLocator.press(char)
  })
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
    test(`${nodeDef.label} edit expression "${expression.expression}"`, async () => {
      if (idx === 0) {
        // goto tab
        const tab =
          TestId.nodeDefDetails.validations === expression.type
            ? TestId.nodeDefDetails.validations
            : TestId.nodeDefDetails.advanced
        await page.click(getSelector(TestId.tabBar.tabBarBtn(tab), 'button'))
      }

      // goto expression editor
      const button = (await page.$$(getSelector(TestId.expressionEditor.editBtn(expression.type), 'button')))[idx]
      await button.click()

      const editFn = editFns[nodeDef.type] || editAdvanced
      await editFn(expression.expression)

      await page.click(getSelector(TestId.expressionEditor.applyBtn, 'button'))
    })

    if (expression.applyIf) {
      test(`${nodeDef.label} edit expression ${expression.expression} applyIf ${expression.applyIf}`, async () => {
        const btnId = TestId.expressionEditor.editBtn(TestId.nodeDefDetails.applyIf(expression.type))
        const button = (await page.$$(getSelector(btnId, 'button')))[idx]
        await button.click()

        await editAdvanced(expression.applyIf)

        await page.click(getSelector(TestId.expressionEditor.applyBtn, 'button'))
      })
    }
  })

  persistNodeDefChanges(nodeDef)
}
