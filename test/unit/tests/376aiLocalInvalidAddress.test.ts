import { createCapabilitiesStore } from '@webapp/ai/engines/capabilities'
import { getAiUnavailableReasonActions, getAiUnavailableReasonKey } from '@webapp/ai/engines/featureAvailability'
import { loadLocalProviders, saveLocalProviders } from '@webapp/ai/engines/localProviders'
import { selectEngine } from '@webapp/ai/engines/selectEngine'
import {
  isLocalDraftUrlInvalid,
  type ProviderDraft,
} from '@webapp/components/ai/UserAiSettingsPanel/ProviderDialog/providerDraft'
import en from '@core/i18n/resources/en'
import es from '@core/i18n/resources/es'
import fr from '@core/i18n/resources/fr'
import ja from '@core/i18n/resources/ja'
import mn from '@core/i18n/resources/mn'
import pt from '@core/i18n/resources/pt'
import ru from '@core/i18n/resources/ru'

const GOOD = { id: 'local:a', name: 'Good', baseUrl: 'http://localhost:1234/v1', modelId: 'm' }
const BAD = { id: 'local:b', name: 'Credentials', baseUrl: 'http://u:p@localhost:1234/v1', modelId: 'm' }

const memoryStorage = (initial: unknown) => {
  let value = JSON.stringify(initial)
  return {
    getItem: () => value,
    setItem: (_key: string, next: string) => {
      value = next
    },
    read: () => JSON.parse(value),
  }
}

describe('a stored local provider with an invalid address is kept and marked (376)', () => {
  test('it is loaded with the address as it was typed, flagged', () => {
    const storage = memoryStorage([GOOD, BAD])
    const providers = loadLocalProviders({ storage, userUuid: 'u1' })
    expect(providers.map((provider) => [provider.id, provider.addressInvalid === true])).toEqual([
      ['local:a', false],
      ['local:b', true],
    ])
    expect(providers[1].baseUrl).toBe(BAD.baseUrl)
  })

  test('saving the list keeps it, so the user can still open and fix it', () => {
    const storage = memoryStorage([GOOD, BAD])
    const providers = loadLocalProviders({ storage, userUuid: 'u1' })
    saveLocalProviders({ storage, userUuid: 'u1', providers })
    expect(storage.read().map((provider: any) => provider.id)).toEqual(['local:a', 'local:b'])
  })

  test('an entry without a text address is still dropped', () => {
    const storage = memoryStorage([{ ...GOOD, baseUrl: 42 }, { ...GOOD, id: 'local:c', baseUrl: '  ' }, BAD])
    expect(loadLocalProviders({ storage, userUuid: 'u1' }).map((provider) => provider.id)).toEqual(['local:b'])
  })
})

describe('an invalid address is not probed and says why (376)', () => {
  const settings = {
    featuresEnabled: true,
    featureToggles: { expressions: true },
    accessLevel: 2,
    policyCeilings: { schema: 'cloud' as const, data: 'cloud' as const },
    defaultProviderId: 'local:b',
  }

  const load = async () => {
    const probes: string[] = []
    const store = createCapabilitiesStore({
      loadSettings: async () => settings as never,
      loadLocalProviders: () => [{ ...GOOD }, { ...BAD, addressInvalid: true }],
      probe: async ({ baseUrl }) => {
        probes.push(baseUrl)
        return { reachable: true, models: ['m'], contextTokens: 4096, error: null }
      },
    })
    return { capabilities: await store.load({ userUuid: 'u1' }), probes }
  }

  test('only the valid address is probed', async () => {
    const { probes } = await load()
    expect(probes).toEqual(['http://localhost:1234/v1'])
  })

  test('the entry is not set up and flagged; its capability reports no hosting class', async () => {
    const { capabilities } = await load()
    const entry = capabilities.providers.find((candidate) => candidate.id === 'local:b')
    expect(entry).toMatchObject({ status: 'notSetUp', addressInvalid: true, hostingClass: null })
    expect(capabilities.local['local:b'].hostingClass).toBeNull()
  })

  test('a default provider with an invalid address is not "on another computer"', async () => {
    const { capabilities } = await load()
    const selection = selectEngine({
      effective: { schema: 'cloud', data: 'cloud' },
      dataClass: 'schema',
      capabilities,
    })
    expect(selection).toEqual({ unavailable: ['invalidAddress'] })
  })

  test('the reason points to the settings and has a text key', () => {
    expect(getAiUnavailableReasonKey('invalidAddress' as never)).toBe('aiEngine.unavailable.invalidAddress')
    expect(getAiUnavailableReasonActions('invalidAddress' as never)).toEqual(['openSettings'])
  })
})

describe('the provider dialog explains an address it refuses (376)', () => {
  const draft = (baseUrl: string) => ({ baseUrl }) as ProviderDraft

  test('a typed address that is not plain is invalid; an empty or good one is not', () => {
    expect(isLocalDraftUrlInvalid(draft('user:pass@localhost:1234/v1'))).toBe(true)
    expect(isLocalDraftUrlInvalid(draft('localhost:1234/v1?x=1'))).toBe(true)
    expect(isLocalDraftUrlInvalid(draft('localhost:1234/v1#x'))).toBe(true)
    expect(isLocalDraftUrlInvalid(draft('   '))).toBe(false)
    expect(isLocalDraftUrlInvalid(draft('localhost:1234/v1'))).toBe(false)
  })
})

const resources: Record<string, any> = { en, es, fr, ja, mn, pt, ru }

describe('the texts exist in every language (376)', () => {
  test.each(Object.keys(resources))('%s', (lang) => {
    const { aiEngine } = resources[lang].common
    expect(typeof aiEngine.unavailable.invalidAddress).toBe('string')
    expect(typeof aiEngine.localAddressInvalid).toBe('string')
  })
})
