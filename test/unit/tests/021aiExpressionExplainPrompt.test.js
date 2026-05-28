/**
 * Tests for the prompt builder used by the streaming "explain expression"
 * feature (Tier 1 #3).
 */
import { buildExpressionExplainPrompt } from '@server/modules/ai/service/prompts/expressionExplain'

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

  test('prompts the LLM to diagnose when an error message is provided', () => {
    const target = makeNodeDef({ uuid: 'a', name: 'tree_height' })
    const survey = { nodeDefs: { a: target } }

    const { prompt } = buildExpressionExplainPrompt({
      survey,
      nodeDef: target,
      expression: 'this > parent().bad',
      errorMessage: 'Function "bad" is not a sibling',
    })

    expect(prompt).toMatch(/Error reported/)
    // `errorMessage` is JSON-stringified into the prompt so the model treats
    // it as a data token rather than an instruction; the inner quotes around
    // "bad" arrive escaped (\").
    expect(prompt).toMatch(/Function \\"bad\\" is not a sibling/)
    expect(prompt).toMatch(/diagnose/i)
  })

  test('does not include diagnose section when no error message', () => {
    const target = makeNodeDef({ uuid: 'a', name: 'tree_height' })
    const survey = { nodeDefs: { a: target } }

    const { prompt } = buildExpressionExplainPrompt({
      survey,
      nodeDef: target,
      expression: 'this >= 0',
    })

    expect(prompt).not.toMatch(/Error reported/)
    expect(prompt).not.toMatch(/diagnose/i)
  })
})
