import {
  buildExplainExpressionRequest,
  generateExpression,
  parseTaggedExpressionResponse,
  tryParseExpression,
} from '@common/ai/tasks/expression'
import { expectSystemErrorKey, scriptedTextGenerator } from '@test/unit/utils/aiTestUtils'

const target = { uuid: 'a', props: { name: 'tree_height' }, type: 'decimal' }
const survey = { nodeDefs: { a: target } }
const baseParams = { survey, nodeDefUuid: 'a', expressionType: 'validation', description: 'must be positive' }

describe('parseTaggedExpressionResponse', () => {
  test('reads the tags, stripping fences inside and outside', () => {
    const text = '```xml\n<expression>```\ntree_height > 0\n```</expression>\n<explanation>Positive.</explanation>\n```'
    expect(parseTaggedExpressionResponse(text)).toEqual({ expression: 'tree_height > 0', explanation: 'Positive.' })
  })

  test('falls back to the whole text when the tags are missing', () => {
    expect(parseTaggedExpressionResponse(' tree_height > 0 ')).toEqual({
      expression: 'tree_height > 0',
      explanation: '',
    })
  })
})

describe('tryParseExpression', () => {
  test('accepts a valid expression and reports the parser error otherwise', () => {
    expect(tryParseExpression('tree_height > 0')).toEqual({ valid: true })
    const invalid = tryParseExpression('tree_height >')
    expect(invalid.valid).toBe(false)
    expect(invalid.error).toBeTruthy()
  })
})

describe('generateExpression', () => {
  test('returns a valid expression from the first answer', async () => {
    const { generateText, calls } = scriptedTextGenerator(
      '<expression>tree_height > 0</expression><explanation>Positive.</explanation>'
    )
    const result = await generateExpression({ generateText, ...baseParams })
    expect(result).toEqual({
      expression: 'tree_height > 0',
      explanation: 'Positive.',
      isValid: true,
      parseError: undefined,
    })
    expect(calls).toHaveLength(1)
    expect(calls[0].prompt).toMatch(/must be positive/)
  })

  test('retries once with the rejected expression and the parser error', async () => {
    const { generateText, calls } = scriptedTextGenerator(
      '<expression>tree_height ></expression>',
      '<expression>tree_height > 0</expression>'
    )
    const result = await generateExpression({ generateText, ...baseParams })
    expect(result.isValid).toBe(true)
    expect(calls).toHaveLength(2)
    expect(calls[1].prompt).toMatch(/failed to parse/)
  })

  test('returns the second invalid answer with its parse error (no third call)', async () => {
    const { generateText, calls } = scriptedTextGenerator('(((', ')))')
    const result = await generateExpression({ generateText, ...baseParams })
    expect(result.isValid).toBe(false)
    expect(result.expression).toBe(')))')
    expect(result.parseError).toBeTruthy()
    expect(calls).toHaveLength(2)
  })

  test.each([
    [{ description: '  ' }, 'aiExpressionDescriptionMissing'],
    [{ description: 'x'.repeat(4001) }, 'aiInputTooLong'],
    [{ expressionType: 'other' }, 'aiExpressionTypeInvalid'],
    [{ nodeDefUuid: null }, 'aiExpressionNodeDefMissing'],
    [{ nodeDefUuid: 'missing' }, 'aiExpressionNodeDefNotFound'],
  ])('rejects invalid input %p with %p before calling the model', async (override, key) => {
    const { generateText, calls } = scriptedTextGenerator()
    await expectSystemErrorKey(generateExpression({ generateText, ...baseParams, ...override }), key)
    expect(calls).toHaveLength(0)
  })
})

describe('buildExplainExpressionRequest', () => {
  test('builds the explain prompt for the target node def', () => {
    const request = buildExplainExpressionRequest({ survey, nodeDefUuid: 'a', expression: 'tree_height > 0' })
    expect(request.system).toBeTruthy()
    expect(request.prompt).toMatch(/tree_height > 0/)
  })

  test.each([
    [{ expression: ' ' }, 'aiExpressionExpressionMissing'],
    [{ expression: 'x'.repeat(4001) }, 'aiInputTooLong'],
    [{ errorMessage: 'e'.repeat(4001) }, 'aiInputTooLong'],
    [{ nodeDefUuid: 'missing' }, 'aiExpressionNodeDefNotFound'],
  ])('rejects %p with %p', async (override, key) => {
    await expectSystemErrorKey(
      () => buildExplainExpressionRequest({ survey, nodeDefUuid: 'a', expression: 'tree_height > 0', ...override }),
      key
    )
  })
})
