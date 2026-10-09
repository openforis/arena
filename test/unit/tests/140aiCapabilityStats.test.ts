import { formatCapabilityStats, parseCapabilityStats } from '@common/ai/capabilityStats'

import {
  buildCapabilityStatsPayload,
  CAPABILITY_STATS_SENT_KEY,
  createCapabilityStatsSender,
  getBrowserFamily,
  getDeviceMemoryBucket,
  getPromptApiState,
} from '@webapp/ai/engines/capabilityStatsSender'
import type { AiCapabilities, StorageLike } from '@webapp/ai/engines/types'

const UA = {
  chrome:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36',
  edge: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0',
  firefox: 'Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0',
  safari:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15',
  chromeIos:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/148.0 Mobile/15E148 Safari/604.1',
}

const memoryStorage = (): StorageLike => {
  const data = new Map<string, string>()
  return { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => void data.set(key, value) }
}

const capabilities = (localServer: Partial<AiCapabilities['localServer']> = {}): AiCapabilities => ({
  localServer: {
    enabled: true,
    reachable: true,
    models: ['local-model'],
    hostingClass: 'onDevice',
    contextTokens: 8192,
    baseUrl: 'http://localhost:1234/v1',
    modelId: 'local-model',
    error: null,
    ...localServer,
  },
  gateway: { available: true, hostingClass: 'cloud', provider: 'openai', model: 'm', maxPromptChars: 200000 },
  device: { webGpu: true, deviceMemoryGb: 8, promptApi: 'downloading' },
  instance: { policyCeilings: { schema: 'cloud', data: 'cloud' }, orgHostedBaseUrls: [] },
})

describe('payload', () => {
  test.each([
    [null, null],
    [0.5, '≤2'],
    [2, '≤2'],
    [4, '4'],
    [8, '8+'],
    [16, '8+'],
  ])('memory %s → %s', (gb, bucket) => {
    expect(getDeviceMemoryBucket(gb as number | null)).toBe(bucket)
  })

  test('browser families', () => {
    expect(getBrowserFamily(UA.chrome)).toBe('chrome')
    expect(getBrowserFamily(UA.edge)).toBe('edge')
    expect(getBrowserFamily(UA.firefox)).toBe('firefox')
    expect(getBrowserFamily(UA.safari)).toBe('safari')
    expect(getBrowserFamily(UA.chromeIos)).toBe('chrome')
    expect(getBrowserFamily('curl/8.0')).toBe('other')
  })

  test('Prompt API states', () => {
    expect([null, 'unavailable', 'downloadable', 'downloading', 'available', 'weird'].map(getPromptApiState)).toEqual([
      null,
      'unavailable',
      'downloadable',
      'downloadable',
      'available',
      null,
    ])
  })

  test('no URL, model or identifier in the payload', () => {
    const payload = buildCapabilityStatsPayload({ capabilities: capabilities(), userAgent: UA.chrome })
    expect(payload).toEqual({
      webGpu: true,
      deviceMemoryBucket: '8+',
      promptApi: 'downloadable',
      localServer: 'onDevice',
      browser: 'chrome',
    })
    expect(parseCapabilityStats(payload)).toEqual(payload)
  })

  test('local server states', () => {
    const stat = (localServer: Partial<AiCapabilities['localServer']>) =>
      buildCapabilityStatsPayload({ capabilities: capabilities(localServer), userAgent: UA.chrome }).localServer
    expect(stat({ enabled: false })).toBe('off')
    expect(stat({ reachable: false })).toBe('unreachable')
    expect(stat({ hostingClass: 'orgHosted' })).toBe('orgHosted')
    expect(stat({ hostingClass: 'cloud' })).toBe('cloud')
  })
})

describe('parse and format', () => {
  const valid = { webGpu: false, deviceMemoryBucket: null, promptApi: null, localServer: 'off', browser: 'other' }

  test('extra keys, missing keys and wrong values are refused', () => {
    expect(parseCapabilityStats(valid)).toEqual(valid)
    expect(parseCapabilityStats({ ...valid, userUuid: 'u' })).toBeNull()
    expect(parseCapabilityStats({ ...valid, baseUrl: 'http://localhost:1234/v1' })).toBeNull()
    const missing: Record<string, unknown> = { ...valid }
    delete missing.browser
    expect(parseCapabilityStats(missing)).toBeNull()
    expect(parseCapabilityStats({ ...valid, webGpu: 'yes' })).toBeNull()
    expect(parseCapabilityStats({ ...valid, localServer: 'http://10.0.0.5' })).toBeNull()
    expect(parseCapabilityStats({ ...valid, deviceMemoryBucket: '16' })).toBeNull()
    expect(parseCapabilityStats(null)).toBeNull()
    expect(parseCapabilityStats([valid])).toBeNull()
  })

  test('the log line has the five values only', () => {
    expect(formatCapabilityStats({ ...valid, deviceMemoryBucket: '4', promptApi: 'available' } as any)).toBe(
      'webGpu=false deviceMemory=4 promptApi=available localServer=off browser=other'
    )
  })
})

describe('createCapabilityStatsSender', () => {
  const payload = {
    webGpu: false,
    deviceMemoryBucket: null,
    promptApi: null,
    localServer: 'off',
    browser: 'other',
  } as const

  test('only when opted in, once per session', async () => {
    const storage = memoryStorage()
    const sent: unknown[] = []
    const sender = createCapabilityStatsSender({ storage, send: async (stats) => sent.push(stats) })
    expect(await sender.maybeSend({ optedIn: false, getPayload: () => payload })).toBe(false)
    expect(await sender.maybeSend({ optedIn: true, getPayload: () => payload })).toBe(true)
    expect(await sender.maybeSend({ optedIn: true, getPayload: () => payload })).toBe(false)
    expect(sent).toEqual([payload])
    expect(storage.getItem(CAPABILITY_STATS_SENT_KEY)).toBe('true')
  })

  test('a new page in the same session does not send again', async () => {
    const storage = memoryStorage()
    storage.setItem(CAPABILITY_STATS_SENT_KEY, 'true')
    const sent: unknown[] = []
    const sender = createCapabilityStatsSender({ storage, send: async (stats) => sent.push(stats) })
    expect(await sender.maybeSend({ optedIn: true, getPayload: () => payload })).toBe(false)
    expect(sent).toEqual([])
  })

  test('without storage: once per page load; a failed send is not retried', async () => {
    let calls = 0
    const sender = createCapabilityStatsSender({
      storage: null,
      send: async () => {
        calls += 1
        throw new Error('offline')
      },
    })
    expect(await sender.maybeSend({ optedIn: true, getPayload: () => payload })).toBe(false)
    expect(await sender.maybeSend({ optedIn: true, getPayload: () => payload })).toBe(false)
    expect(calls).toBe(1)
  })
})
