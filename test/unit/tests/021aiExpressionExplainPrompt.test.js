/**
 * Tests for the prompt builder used by the streaming "explain expression"
 * feature (Tier 1 #3).
 */
import { buildExpressionExplainPrompt } from '@common/ai/prompts/expressionExplain'

const makeNodeDef = ({ uuid, name, type = 'decimal' }) => ({
  uuid,
  props: { name },
  type,
})

describe('buildExpressionExplainPrompt', () => {
  test('emits a non-empty system prompt covering style guidance', () => {
    const target = makeNodeDef({ uuid: 'a', name: 'tree_height' })
    const survey = { nodeDefs: { a: target } }

    const { system, prompt } = buildExpressionExplainPrompt({
      survey,
      nodeDef: target,
      expression: 'this >= 0',
    })

    expect(system).toMatch(/Arena/i)
    expect(system).toMatch(/non-programmer/)
    expect(system).toMatch(/Plain prose/i)
    expect(prompt).toMatch(/tree_height/)
    expect(prompt).toMatch(/this >= 0/)
  })
})
