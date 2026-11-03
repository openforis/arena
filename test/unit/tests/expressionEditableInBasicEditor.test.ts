import * as Expression from '@core/expressionParser/expression'
import * as ExpressionParser from '@webapp/components/expression/expressionParser'

describe('ExpressionParser.isEditableInBasicEditor', () => {
  test.each([
    ['a == 1', true],
    ['a > -1 && parent.b != "x"', true],
    ['isEmpty(a) || (b == 2)', true],
    ["text_attr.includes('aaa')", false],
    ["a == 1 && text_attr.toLowerCase().startsWith('aaa')", false],
    ['!a', false],
  ])('%s', (exprString, expected) => {
    expect(ExpressionParser.isEditableInBasicEditor(Expression.fromString(exprString) as object)).toBe(expected)
  })

  test('empty expression', () => {
    expect(ExpressionParser.isEditableInBasicEditor(null)).toBe(true)
  })
})
