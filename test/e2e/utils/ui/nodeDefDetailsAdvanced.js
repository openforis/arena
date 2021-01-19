import { click, expectExists, expectNotExists, waitFor1sec } from '../api'
import { setExpression } from './expressionEditor'

import {
  placeholderIndex,
  expressionEditorElements,
  nodeDefDetailsAdvancedSelectors as selectors,
  qualifiers,
} from './nodeDefDetailsAdvancedSelectors'

const _countExpressionItems = async ({ qualifier }) => {
  const expressionItems = await expressionEditorElements.expressionItems({ qualifier })
  return (await expressionItems.elements()).length
}

const _expectTextToBe = async ({ element, text }) => {
  await expect(element.exists()).toBeTruthy()
  const elementText = await element.text()
  await expect(elementText).toBe(text)
}

export const expectNodeDefExpression = async ({ qualifier, index = 0, text }) => {
  const expressionQueryEl = await expressionEditorElements.expressionQuery({ qualifier, index })
  await _expectTextToBe({ element: expressionQueryEl, text })
}

export const expectExpressionItemsToBe = async ({ qualifier, count: countExpected }) => {
  const count = await _countExpressionItems({ qualifier })
  await expect(count).toBe(countExpected)
}

export const expectNodeDefExpressionsInvalid = async ({ qualifier }) =>
  expectExists({ selector: selectors.expressionEditorsWrapperInvalid({ qualifier }) })

export const expectNodeDefExpressionsValid = async ({ qualifier }) =>
  expectNotExists({ selector: selectors.expressionEditorsWrapperInvalid({ qualifier }) })

export const setNodeDefExpression = async ({ qualifier, index, expression, expressionText, applyIf, applyIfText }) => {
  const expressionItemsCountBefore = await _countExpressionItems({ qualifier })

  await click(expressionEditorElements.expressionEditBtn({ qualifier, index }))

  await setExpression(expression)

  const multipleExpressions = qualifier !== qualifiers.relevantIf

  const expressionItemsCountAfter = await _countExpressionItems({ qualifier })
  const expressionItemsCountAfterExpected = expressionItemsCountBefore + (multipleExpressions ? 1 : 0)
  await expect(expressionItemsCountAfter).toBe(expressionItemsCountAfterExpected)

  const indexAfter = expressionItemsCountAfter - 1 - (multipleExpressions ? 1 : 0)

  await expectNodeDefExpression({ qualifier, index: indexAfter, text: expressionText })

  if (applyIf) {
    await click(expressionEditorElements.applyIfEditBtn({ qualifier, index: indexAfter }))
    await setExpression(applyIf)
    const expressionQueryEl = await expressionEditorElements.applyIfQuery({ qualifier, index: indexAfter })
    await _expectTextToBe({ element: expressionQueryEl, text: applyIfText })
  }
}

export const addNodeDefExpression = async ({ qualifier, expression, expressionText, applyIf, applyIfText }) =>
  setNodeDefExpression({ qualifier, index: placeholderIndex, expression, expressionText, applyIf, applyIfText })

export const deleteNodeDefExpression = async ({ qualifier, index = 0 }) => {
  const expressionItemsCountBefore = await _countExpressionItems({ qualifier })

  await click(expressionEditorElements.deleteBtn({ qualifier, index }))
  await waitFor1sec()
  await click('Ok')

  await expectExpressionItemsToBe({ qualifier, count: expressionItemsCountBefore - 1 })
}
