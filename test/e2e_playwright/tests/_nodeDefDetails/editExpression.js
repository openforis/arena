import { each } from '../../../../core/promiseUtils'
import { DataTestId, getSelector } from '../../../../webapp/utils/dataTestId'
import { persistNodeDefChanges } from './editDetails'

const editAdvanced = async (expressionStr) => {
  await page.click(getSelector(DataTestId.expressionEditor.toggleModeBtn, 'button'))
  // wait for codemirror to initialize
  await page.waitForTimeout(500)

  const codeMirror = await page.waitForSelector('.CodeMirror')
  await each(expressionStr, async (char) => {
    await codeMirror.press(char)
  })
}

const editBoolean = async (expressionStr) => page.click(`text="${expressionStr}"`)

const editDropdown = async (expressionStr) => {
  // TODO make a better selector
  await page.focus("//div[normalize-space(.)='VarConst']/div/div/div/input[normalize-space(@type)='text']")
  await page.click(getSelector(DataTestId.dropdown.dropDownItem(expressionStr)))
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
          DataTestId.nodeDefDetails.validations === expression.type
            ? DataTestId.nodeDefDetails.validations
            : DataTestId.nodeDefDetails.advanced
        await page.click(getSelector(DataTestId.tabBar.tabBarBtn(tab), 'button'))
      }

      // goto expression editor
      const button = (await page.$$(getSelector(DataTestId.expressionEditor.editBtn(expression.type), 'button')))[idx]
      await button.click()

      const editFn = editFns[nodeDef.type] || editAdvanced
      await editFn(expression.expression)

      await page.click(getSelector(DataTestId.expressionEditor.applyBtn, 'button'))
    })

    if (expression.applyIf) {
      test(`${nodeDef.label} edit expression ${expression.expression} applyIf ${expression.applyIf}`, async () => {
        const btnId = DataTestId.expressionEditor.editBtn(DataTestId.nodeDefDetails.applyIf(expression.type))
        const button = (await page.$$(getSelector(btnId, 'button')))[idx]
        await button.click()

        await editAdvanced(expression.applyIf)

        await page.click(getSelector(DataTestId.expressionEditor.applyBtn, 'button'))
      })
    }
  })

  persistNodeDefChanges(nodeDef)
}
