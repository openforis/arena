import { click, waitFor1sec } from '../api'
import { setBinaryLeftConst, setExpression } from './expressionEditor'

import { nodeDefDetailsSelectorsAdvanced as selectorsAdv } from './nodeDefDetailsAdvancedSelectors'

export const addNodeDefDefaultValue = async ({ constant }) => {
  await click('Advanced')

  await click(selectorsAdv.defaultValuePlaceholderExpressionEditBtn())

  await setBinaryLeftConst({ value: constant })

  await click('Apply')
}

export const addNodeDefBooleanDefaultValue = async ({ defaultValue }) => {
  await click('Advanced')

  await waitFor1sec()
  await click(selectorsAdv.defaultValuePlaceholderExpressionEditBtn())

  await waitFor1sec()
  await click(defaultValue)

  await click('Apply')
}

const _expectContainerTextToBe = async ({ container, text }) => {
  await expect(container.exists()).toBeTruthy()
  const containerText = await container.text()
  await expect(containerText).toBe(text)
}

export const expectNodeDefDefaultValue = async ({ expression, index = 0 }) => {
  const container = await selectorsAdv.defaultValueExpressionQuery({ index })
  await _expectContainerTextToBe({ container, text: expression })
}

export const setNodeDefRelevantIf = async ({ binaryExpression, expression, placeholder = true }) => {
  await click('Advanced')

  const editBtnSelector = placeholder ? selectorsAdv.relevantIfPlaceholderEditBtn() : selectorsAdv.relevantIfEditBtn()
  await click(editBtnSelector)

  await waitFor1sec()

  await setExpression({ binaryExpression, expression })

  await click('Apply')
}

export const expectNodeDefRelevantIf = async ({ expression }) => {
  const container = await selectorsAdv.relevantIfExpressionQuery()
  await _expectContainerTextToBe({ container, text: expression })
}

export const setNodeDefDefaultValueApplyIf = async ({ expression, index = 0 }) => {
  await click('Advanced')

  await click(selectorsAdv.defaultValueApplyIfEditBtn({ index }))
  await waitFor1sec()

  await setExpression({ expression })

  await click('Apply')
}

export const expectNodeDefDefaultValueApplyIf = async ({ expression, index = 0 }) => {
  const container = await selectorsAdv.defaultValueApplyIfQuery({ index })
  await _expectContainerTextToBe({ container, text: expression })
}
