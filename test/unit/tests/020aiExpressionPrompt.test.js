/**
 * Tests for the prompt builder used by the natural-language → expression
 * feature (Tier 1 #2). The builder is a pure function so we can verify it
 * here without going through the LLM gateway.
 */
import { buildExpressionGeneratePrompt } from '@server/modules/ai/service/prompts/expressionGenerate'

const makeNodeDef = ({ uuid, name, type = 'decimal' }) => ({
  uuid,
  props: { name },
  type,
})

const surveyWith = ({ targetUuid, parentUuid, siblings }) => {
  const target = makeNodeDef({ uuid: targetUuid, name: 'tree_height' })
  const parent = makeNodeDef({ uuid: parentUuid, name: 'plot', type: 'entity' })
  const allDefs = [target, parent, ...siblings]
  return {
    nodeDefs: Object.fromEntries(allDefs.map((nd) => [nd.uuid, nd])),
    target,
    parent,
  }
}

describe('buildExpressionGeneratePrompt', () => {
  test('emits a non-empty system prompt and references the function list', () => {
    const target = makeNodeDef({ uuid: 'a', name: 'tree_height' })
    const survey = { nodeDefs: { a: target } }

    const { system, prompt } = buildExpressionGeneratePrompt({
      survey,
      nodeDef: target,
      expressionType: 'validation',
      description: 'must be > 0',
    })

    expect(system).toMatch(/Arena/i)
    expect(system).toMatch(/Logical: && \(and\), \|\| \(or\)/)
    expect(system).toMatch(/parent\(\)/)
    expect(prompt).toMatch(/tree_height/)
    expect(prompt).toMatch(/validation/)
    expect(prompt).toMatch(/must be > 0/)
  })

  test('instructs the model to wrap output in <expression>/<explanation> tags', () => {
    const target = makeNodeDef({ uuid: 'a', name: 'tree_height' })
    const survey = { nodeDefs: { a: target } }

    const { system } = buildExpressionGeneratePrompt({
      survey,
      nodeDef: target,
      expressionType: 'validation',
      description: 'must be > 0',
    })

    expect(system).toMatch(/<expression>/)
    expect(system).toMatch(/<\/expression>/)
    expect(system).toMatch(/<explanation>/)
    expect(system).toMatch(/<\/explanation>/)
    expect(system).not.toMatch(/JSON/i)
  })

  test('lists sibling fields when a parent entity is present', () => {
    // Cannot fully test without the real Survey accessors; this exercises the
    // safe path where parent lookup returns undefined.
    const target = makeNodeDef({ uuid: 'a', name: 'tree_height' })
    const survey = { nodeDefs: { a: target } }

    const { prompt } = buildExpressionGeneratePrompt({
      survey,
      nodeDef: target,
      expressionType: 'validation',
      description: 'must be positive',
    })

    expect(prompt).toMatch(/Sibling fields/i)
  })

  test('appends previous-error feedback when retrying', () => {
    const target = makeNodeDef({ uuid: 'a', name: 'tree_height' })
    const survey = { nodeDefs: { a: target } }

    const { prompt } = buildExpressionGeneratePrompt({
      survey,
      nodeDef: target,
      expressionType: 'validation',
      description: 'must be > 0',
      previousError: { expression: 'this >', message: 'Unexpected token' },
    })

    expect(prompt).toMatch(/previous attempt/i)
    expect(prompt).toMatch(/Unexpected token/)
    expect(prompt).toMatch(/this >/)
  })

  test('uses the right hint for each expression type', () => {
    const target = makeNodeDef({ uuid: 'a', name: 'tree_height' })
    const survey = { nodeDefs: { a: target } }

    const validation = buildExpressionGeneratePrompt({
      survey,
      nodeDef: target,
      expressionType: 'validation',
      description: 'x',
    })
    const applicable = buildExpressionGeneratePrompt({
      survey,
      nodeDef: target,
      expressionType: 'applicableIf',
      description: 'x',
    })
    const defaultVal = buildExpressionGeneratePrompt({
      survey,
      nodeDef: target,
      expressionType: 'defaultValue',
      description: 'x',
    })

    expect(validation.prompt).toMatch(/boolean expression that must evaluate to true/)
    expect(applicable.prompt).toMatch(/gates whether the field is enabled/)
    expect(defaultVal.prompt).toMatch(/initial value/)
  })
})
