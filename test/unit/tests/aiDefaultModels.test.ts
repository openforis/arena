import { ENV } from '@core/processUtils'

import { getDefaultModel, getDefaultModels } from '@server/modules/ai/service/defaultModels'

describe('AI default models', () => {
  const { aiDefaultProvider, aiDefaultModel } = ENV

  afterEach(() => {
    ENV.aiDefaultProvider = aiDefaultProvider
    ENV.aiDefaultModel = aiDefaultModel
  })

  test('built-in default model, none for openai-compatible', () => {
    ENV.aiDefaultProvider = undefined
    expect(getDefaultModel('google-vertex')).toBeTruthy()
    expect(getDefaultModel('openai-compatible')).toBeNull()
    expect(getDefaultModels()['openai-compatible']).toBeUndefined()
  })

  test('the admin default model wins for the admin default provider only', () => {
    ENV.aiDefaultProvider = 'openai-compatible'
    ENV.aiDefaultModel = 'llama3.3:70b'
    expect(getDefaultModel('openai-compatible')).toBe('llama3.3:70b')
    expect(getDefaultModel('google-vertex')).not.toBe('llama3.3:70b')
  })
})
