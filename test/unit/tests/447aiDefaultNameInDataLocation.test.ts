import { getGatewayEngineInfo, getLocalServerEngineInfo } from '@webapp/ai/engines/engineInfo'
import { toDataLocation } from '@webapp/ai/engines/featureAvailability'
import type { AiLocalServerCapability, AiProviderEntry } from '@webapp/ai/engines/types'
import { getAiDataLocationText } from '@webapp/ai/policy/aiFeatureAvailability'
import { fakeT as t } from '../utils/fakeT'

// a fake t: translated texts are marked, so the test sees what went through it

const capability: AiLocalServerCapability = {
  reachable: true,
  models: ['m'],
  hostingClass: 'onDevice',
  contextTokens: null,
  baseUrl: 'http://localhost:1234/v1',
  modelId: 'm',
  error: null,
}

const accountEntry = (overrides: Partial<AiProviderEntry>): AiProviderEntry => ({
  id: 'acct:1',
  kind: 'account',
  type: 'openai-compatible',
  name: 'OpenAI-compatible',
  model: 'm',
  baseUrl: 'https://org.example.org/v1',
  hostingClass: 'orgHosted',
  status: 'ready',
  ...overrides,
})

const locationText = (engine: ReturnType<typeof getGatewayEngineInfo>) =>
  getAiDataLocationText({ location: toDataLocation(engine!), t })

describe('a default provider name in the data-location texts is translated (447)', () => {
  test('a local server with the default name', () => {
    const engine = getLocalServerEngineInfo({ entry: { id: 'local:1', name: 'Local server' }, capability })
    expect(engine?.labelKey).toBe('userAiSettings:defaultName.local')
    expect(locationText(engine)).toBe('aiDataLocation.onDeviceWithEngine{"engine":"userAiSettings:defaultName.local"}')
  })

  test('a name the user typed is shown as it is', () => {
    const engine = getLocalServerEngineInfo({ entry: { id: 'local:1', name: 'My laptop' }, capability })
    expect(engine?.labelKey).toBeNull()
    expect(locationText(engine)).toBe('aiDataLocation.onDeviceWithEngine{"engine":"My laptop"}')
  })

  test('an account provider with the default name of its type', () => {
    const engine = getGatewayEngineInfo({
      entry: accountEntry({ type: 'openai', name: 'OpenAI', hostingClass: 'cloud', baseUrl: null }),
      maxPromptChars: null,
    })
    expect(engine?.labelKey).toBe('userAiSettings:defaultName.openai')
    expect(locationText(engine)).toBe(
      'aiDataLocation.cloudWithProvider{"provider":"userAiSettings:defaultName.openai"}'
    )
  })

  test('Arena default keeps its provider type, mapped to the provider name', () => {
    const engine = getGatewayEngineInfo({
      entry: accountEntry({ id: 'arena-default', kind: 'arenaDefault', type: 'openai', hostingClass: 'cloud' }),
      maxPromptChars: null,
    })
    expect(engine?.labelKey).toBeNull()
    expect(locationText(engine)).toBe('aiDataLocation.cloudWithProvider{"provider":"OpenAI"}')
  })
})
