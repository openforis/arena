import { parseGatewayRequest, sanitizeCall } from '@server/modules/ai/service/gateway/callValidation'
import { expectSystemErrorKey } from '@test/unit/utils/aiTestUtils'

const prompt = [
  { role: 'system', content: 'Be brief.' },
  { role: 'user', content: [{ type: 'text', text: 'Hi' }] },
]
const validBody = { surveyId: 1, feature: 'expressionGenerate', dataClass: 'schema', stream: false, call: { prompt } }
const limits = { maxPromptChars: 100, maxOutputTokens: 1000 }

describe('parseGatewayRequest', () => {
  test('accepts a valid request', () => {
    expect(parseGatewayRequest(validBody)).toEqual(validBody)
  })

  test('chat needs no survey', () => {
    const body = { feature: 'chatbot', dataClass: 'schema', stream: true, call: { prompt } }
    expect(parseGatewayRequest(body).surveyId).toBeUndefined()
  })

  test.each([
    [{ feature: 'nope' }, 'aiFeatureUnknown'],
    [{ feature: 'dataDictionary' }, 'aiFeatureUnknown'],
    [{ feature: 'internalPing' }, 'aiFeatureUnknown'],
    [{ dataClass: 'data' }, 'aiCallInvalid'],
    [{ dataClass: 'secret' }, 'aiCallInvalid'],
    [{ stream: 'yes' }, 'aiCallInvalid'],
    [{ surveyId: undefined }, 'aiCallInvalid'],
    [{ surveyId: -3 }, 'aiCallInvalid'],
    [{ surveyId: '1; drop table' }, 'aiCallInvalid'],
    [{ call: null }, 'aiCallInvalid'],
  ])('rejects %p with %s', async (override, key) => {
    const error = await expectSystemErrorKey(() => parseGatewayRequest({ ...validBody, ...override }), key)
    expect(error.statusCode).toBe(400)
  })

  test('rejects a non-object body', async () => {
    await expectSystemErrorKey(() => parseGatewayRequest('x'), 'aiCallInvalid')
  })

  test('the activity log summary is a data-class feature', () => {
    const body = { ...validBody, feature: 'activityLogSummary', dataClass: 'data' }
    expect(parseGatewayRequest(body).dataClass).toBe('data')
  })
})

describe('sanitizeCall', () => {
  test('keeps the prompt and the sampling options, drops the rest', () => {
    const call = sanitizeCall(
      {
        prompt,
        temperature: 0.2,
        topP: 0.9,
        seed: 1,
        stopSequences: ['END'],
        maxOutputTokens: 50,
        responseFormat: { type: 'json', schema: { huge: true } },
        providerOptions: { openai: { store: true } },
        headers: { 'x-leak': '1' },
        includeRawChunks: true,
      },
      limits
    )
    expect(call).toEqual({
      prompt,
      temperature: 0.2,
      topP: 0.9,
      seed: 1,
      stopSequences: ['END'],
      maxOutputTokens: 50,
      responseFormat: { type: 'json' },
    })
  })

  test('caps maxOutputTokens and sets it when missing', () => {
    expect(sanitizeCall({ prompt, maxOutputTokens: 999999 }, limits).maxOutputTokens).toBe(1000)
    expect(sanitizeCall({ prompt }, limits).maxOutputTokens).toBe(1000)
  })

  test('rejects a prompt over the size limit with aiPromptTooLarge (413)', async () => {
    const big = [{ role: 'user', content: [{ type: 'text', text: 'x'.repeat(101) }] }]
    const error = await expectSystemErrorKey(() => sanitizeCall({ prompt: big }, limits), 'aiPromptTooLarge')
    expect(error.statusCode).toBe(413)
  })

  test.each([
    ['tools', { prompt, tools: [{ type: 'function', name: 'x', inputSchema: {} }] }],
    ['tool role', { prompt: [{ role: 'tool', content: [] }] }],
    ['file part', { prompt: [{ role: 'user', content: [{ type: 'file', data: 'x', mediaType: 'image/png' }] }] }],
    ['non-string system', { prompt: [{ role: 'system', content: [{ type: 'text', text: 'x' }] }] }],
    ['empty prompt', { prompt: [] }],
    ['bad temperature', { prompt, temperature: 'hot' }],
    ['too many stop sequences', { prompt, stopSequences: ['a', 'b', 'c', 'd', 'e'] }],
  ])('rejects %s', async (_label, call) => {
    await expectSystemErrorKey(() => sanitizeCall(call, limits), 'aiCallInvalid')
  })
})
