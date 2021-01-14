import { click, evaluate, waitFor1sec } from '../api'
import { setBinaryLeftConst, setExpression } from './expressionEditor'

import { nodeDefDetailsAdvancedElements as elements } from './nodeDefDetailsAdvancedSelectors'

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

const _getElementClassName = async ({ element }) => evaluate(element, (el) => el.getAttribute('class'))

const _expectElementToHaveClass = async ({ element, className: classNameExpected }) => {
  const className = await _getElementClassName({ element })
  await expect(className.split(' ').includes(classNameExpected)).toBeTruthy()
}

const _expectElementNotToHaveClass = async ({ element, className: classNameExpected }) => {
  const className = await _getElementClassName({ element })
  await expect(className.split(' ').includes(classNameExpected)).toBeFalsy()
}

export const expectNodeDefDefaultValuesInvalid = async () =>
  _expectElementToHaveClass({ element: elements.defaultValuesTooltip(), className: 'tooltip-error' })

export const expectNodeDefDefaultValuesValid = async () =>
  _expectElementNotToHaveClass({ element: elements.defaultValuesTooltip(), className: 'tooltip-error' })
