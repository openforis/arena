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

export const setNodeDefDefaultValueApplyIf = async ({ expression, index = 0 }) => {
  await click('Advanced')

  await click(elements.defaultValueApplyIfEditBtn({ index }))
  await waitFor1sec()

  await setExpression({ expression })
}

export const expectNodeDefDefaultValueApplyIf = async ({ expression, index = 0 }) => {
  const container = await elements.defaultValueApplyIfQuery({ index })
  await _expectContainerTextToBe({ container, text: expression })
}

export const expectNodeDefDefaultValuesInvalid = async () =>
  expectExists({ selector: selectors.defaultValuesTooltip({ error: true }) })

export const expectNodeDefDefaultValuesValid = async () => expectExists({ selector: selectors.defaultValuesTooltip() })

export const setNodeDefRelevantIf = async ({ binaryExpression, expression, placeholder = true }) => {
  await click('Advanced')

  const editBtnSelector = placeholder ? elements.relevantIfPlaceholderEditBtn() : elements.relevantIfEditBtn()
  await click(editBtnSelector)

  await waitFor1sec()

  await setExpression({ binaryExpression, expression })
}

export const expectNodeDefRelevantIf = async ({ expression }) => {
  const container = await elements.relevantIfExpressionQuery()
  await _expectContainerTextToBe({ container, text: expression })
}

export const expectNodeDefValidtionExpressionsCount = async ({ count: countExpected }) => {
  const expressionItems = await elements.validationsExpressionItems()
  const count = (await expressionItems.elements()).length
  await expect(count).toBe(countExpected)
}

export const addNodeDefValidation = async ({ expression, binaryExpression }) => {
  await click(elements.validationExpressionPlaceholderEditBtn())
  await waitFor1sec()
  await setExpression({ expression, binaryExpression })
}

export const expectNodeDefValidation = async ({ expression, index = 0 }) => {
  const container = await elements.validationExpressionQuery({ index })
  await _expectContainerTextToBe({ container, text: expression })
}

export const setNodeDefValidationApplyIf = async ({ expression, binaryExpression, index = 0 }) => {
  await click(elements.validationApplyIfEditBtn({ index }))
  await waitFor1sec()
  await setExpression({ expression, binaryExpression })
}

export const expectNodeDefValidationApplyIf = async ({ expression, index = 0 }) => {
  const container = await elements.validationApplyIfQuery({ index })
  await _expectContainerTextToBe({ container, text: expression })
}

export const deleteNodeDefValidation = async ({ index = 0 } = {}) => {
  await click(elements.validationDeleteBtn({ index }))
  await waitFor1sec()
  await click('Ok')
}
