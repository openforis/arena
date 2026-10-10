import {
  AiFeatures,
  getAiFeatureMinDataClass,
  getMaxAiDataClass,
  isAiDataClass,
  isDeclaredDataClassAllowed,
} from '@common/ai/features'
import { parseGatewayRequest } from '@server/modules/ai/service/gateway/callValidation'

import { expectSystemErrorKey } from '@test/unit/utils/aiTestUtils'

const prompt = [{ role: 'user', content: [{ type: 'text', text: 'Hi' }] }]
const newBody = (feature: string, dataClass: unknown) => ({
  surveyId: 1,
  feature,
  dataClass,
  stream: true,
  call: { prompt },
})

describe('AI data class helpers', () => {
  test('assistantAnalysis is a variable data-class feature', () => {
    expect(AiFeatures.assistantAnalysis).toEqual({
      key: 'assistantAnalysis',
      category: 'assistantAnalysis',
      dataClass: 'data',
      variableDataClass: true,
      permission: 'recordListView',
      gateway: true,
      tools: true,
    })
    expect(AiFeatures.assistantDesign.variableDataClass).toBe(true)
  })

  test('max data class', () => {
    expect(getMaxAiDataClass()).toBe('schema')
    expect(getMaxAiDataClass('schema', 'schema')).toBe('schema')
    expect(getMaxAiDataClass('schema', 'data', 'schema')).toBe('data')
  })

  test('min data class of a feature', () => {
    expect(getAiFeatureMinDataClass('assistantAnalysis')).toBe('schema')
    expect(getAiFeatureMinDataClass('activityLogSummary')).toBe('data')
    expect(getAiFeatureMinDataClass('expressionGenerate')).toBe('schema')
  })

  test('min data class of an unknown feature fails closed', () => {
    expect(getAiFeatureMinDataClass('nope')).toBe('data')
    expect(getAiFeatureMinDataClass('toString')).toBe('data')
  })

  test('isAiDataClass rejects anything else', () => {
    expect(isAiDataClass('schema')).toBe(true)
    expect(isAiDataClass('data')).toBe(true)
    for (const value of ['secret', '', null, undefined, 1, {}, 'toString']) {
      expect(isAiDataClass(value)).toBe(false)
    }
  })

  test.each([
    ['assistantAnalysis', 'schema', true],
    ['assistantAnalysis', 'data', true],
    ['assistantAnalysis', 'secret', false],
    ['assistantDesign', 'schema', true],
    ['assistantDesign', 'data', false],
    ['activityLogSummary', 'data', true],
    ['activityLogSummary', 'schema', false],
    ['expressionGenerate', 'data', false],
  ])('%s declared as %s → %s', (feature, dataClass, allowed) => {
    expect(isDeclaredDataClassAllowed({ featureDef: AiFeatures[feature], dataClass })).toBe(allowed)
  })
})

describe('gateway: declared data class', () => {
  test('a variable feature accepts a class at or below its own', () => {
    expect(parseGatewayRequest(newBody('assistantAnalysis', 'schema')).dataClass).toBe('schema')
    expect(parseGatewayRequest(newBody('assistantAnalysis', 'data')).dataClass).toBe('data')
  })

  test('a variable feature refuses a class above its own', async () => {
    const error = await expectSystemErrorKey(
      () => parseGatewayRequest(newBody('assistantDesign', 'data')),
      'aiCallInvalid'
    )
    expect(error.statusCode).toBe(400)
  })

  test('fixed features still need their exact class', async () => {
    await expectSystemErrorKey(() => parseGatewayRequest(newBody('activityLogSummary', 'schema')), 'aiCallInvalid')
    await expectSystemErrorKey(() => parseGatewayRequest(newBody('expressionGenerate', 'data')), 'aiCallInvalid')
  })

  test('unknown classes are refused', async () => {
    await expectSystemErrorKey(() => parseGatewayRequest(newBody('assistantAnalysis', 'secret')), 'aiCallInvalid')
    await expectSystemErrorKey(() => parseGatewayRequest(newBody('assistantAnalysis', undefined)), 'aiCallInvalid')
  })
})
