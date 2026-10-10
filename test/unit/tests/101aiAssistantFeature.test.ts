import { AiFeatureCategory, AiFeatures, getAiFeature, isGatewayFeature } from '@common/ai/features'
import { AiLimits } from '@common/ai/limits'
import { parseGatewayRequest } from '@server/modules/ai/service/gateway/callValidation'
import { expectSystemErrorKey } from '@test/unit/utils/aiTestUtils'

const prompt = [{ role: 'user', content: [{ type: 'text', text: 'Hi' }] }]

describe('assistantDesign feature', () => {
  test('is a survey-edit, schema, gateway tool feature of the assistantDesign category', () => {
    expect(getAiFeature('assistantDesign')).toEqual({
      key: 'assistantDesign',
      category: AiFeatureCategory.assistantDesign,
      dataClass: 'schema',
      variableDataClass: true,
      permission: 'surveyEdit',
      gateway: true,
      tools: true,
    })
    expect(isGatewayFeature('assistantDesign')).toBe(true)
  })

  test('only the assistant areas may use tools', () => {
    const toolFeatures = Object.values(AiFeatures)
      .filter((feature) => feature.tools)
      .map((feature) => feature.key)
      .sort()
    expect(toolFeatures).toEqual(['assistantAnalysis', 'assistantCleaning', 'assistantDesign', 'chatbot'])
  })

  test('the gateway requires a survey for it', async () => {
    const body = { feature: 'assistantDesign', dataClass: 'schema', stream: true, call: { prompt } }
    await expectSystemErrorKey(() => parseGatewayRequest(body), 'aiCallInvalid')
    expect(parseGatewayRequest({ ...body, surveyId: 3 }).surveyId).toBe(3)
  })

  test('assistant limits', () => {
    expect(AiLimits.assistantMaxSteps).toBe(10)
    expect(AiLimits.assistantToolResultMaxChars).toBe(8000)
    expect(AiLimits.assistantConversationsKept).toBe(30)
    expect(AiLimits.handbookResultMaxChars).toBe(2000)
  })
})
