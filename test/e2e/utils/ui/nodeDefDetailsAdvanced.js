import { click, expectExists, waitFor1sec } from '../api'
import { setBinaryLeftConst, setExpression } from './expressionEditor'

import {
  nodeDefDetailsAdvancedElements as elements,
  nodeDefDetailsAdvancedSelectors as selectors,
} from './nodeDefDetailsAdvancedSelectors'

export const addNodeDefDefaultValue = async ({ constant }) => {
  await click('Advanced')

  await click(elements.defaultValuePlaceholderExpressionEditBtn())

  await setBinaryLeftConst({ value: constant })

  await click('Apply')
}

export const deleteNodeDefDefaultValue = async ({ index = 0 } = {}) => {
  await click(elements.defaultValueExpressionDeleteBtn({ index }))
  await waitFor1sec()
  await click('Ok')
}

export const addNodeDefBooleanDefaultValue = async ({ defaultValue }) => {
  await click('Advanced')

  await waitFor1sec()
  await click(elements.defaultValuePlaceholderExpressionEditBtn())

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
  const container = await elements.defaultValueExpressionQuery({ index })
  await _expectContainerTextToBe({ container, text: expression })
}

export const setNodeDefRelevantIf = async ({ binaryExpression, expression, placeholder = true }) => {
  await click('Advanced')

  const editBtnSelector = placeholder ? elements.relevantIfPlaceholderEditBtn() : elements.relevantIfEditBtn()
  await click(editBtnSelector)

  await waitFor1sec()

  await setExpression({ binaryExpression, expression })

  await click('Apply')
}

export const expectNodeDefRelevantIf = async ({ expression }) => {
  const container = await elements.relevantIfExpressionQuery()
  await _expectContainerTextToBe({ container, text: expression })
}

export const setNodeDefDefaultValueApplyIf = async ({ expression, index = 0 }) => {
  await click('Advanced')

  await click(elements.defaultValueApplyIfEditBtn({ index }))
  await waitFor1sec()

  await setExpression({ expression })

  await click('Apply')
}

export const expectNodeDefDefaultValueApplyIf = async ({ expression, index = 0 }) => {
  const container = await elements.defaultValueApplyIfQuery({ index })
  await _expectContainerTextToBe({ container, text: expression })
}

export const expectNodeDefDefaultValuesInvalid = async () =>
  expectExists({ selector: selectors.defaultValuesTooltip({ error: true }) })

export const expectNodeDefDefaultValuesValid = async () => expectExists({ selector: selectors.defaultValuesTooltip() })
