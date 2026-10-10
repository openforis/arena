import * as AiUserPrefs from '@server/modules/ai/service/aiUserPrefs'
import { getPublicSettings } from '@server/modules/ai/service/aiSettingsService'
import { createCapabilitiesStore, emptyCapabilities } from '@webapp/ai/engines/capabilities'
import { defaultLocalServerSettings } from '@webapp/ai/engines/localServerSettings'

describe('capability statistics and device detection are removed', () => {
  test('the capabilities have no device facts', () => {
    expect(Object.keys(emptyCapabilities()).sort()).toEqual(['gateway', 'instance', 'localServer'])
  })

  test('the store loads without a device reader', async () => {
    const store = createCapabilitiesStore({
      loadSettings: async () => null,
      loadLocalSettings: () => defaultLocalServerSettings(),
      probe: async () => ({ reachable: false, models: [], contextTokens: null, error: null }),
    })
    const capabilities = await store.load({ userUuid: 'u1' })
    expect(Object.keys(capabilities).sort()).toEqual(['gateway', 'instance', 'localServer'])
    expect('detectDevice' in store).toBe(false)
  })

  test('the public settings have no statistics switch, stored or not', () => {
    expect(getPublicSettings({ uuid: 'u1', prefs: {} })).not.toHaveProperty('capabilityStats')
    const stored = { uuid: 'u1', prefs: { ai: { featuresEnabled: true, capabilityStats: true } } }
    expect(getPublicSettings(stored)).not.toHaveProperty('capabilityStats')
  })

  test('the prefs readers of the statistics are gone', () => {
    expect(Object.keys(AiUserPrefs)).not.toContain('isCapabilityStatsEnabledForUser')
    expect(Object.keys(AiUserPrefs)).not.toContain('resolveCapabilityStatsUpdate')
  })
})
