import { isPlainHttpBaseUrl } from '@common/ai/localServerAddress'
import { loadLocalProviders, normalizeLocalProviderBaseUrl } from '@webapp/ai/engines/localProviders'
import {
  getLocalDraftUrl,
  type ProviderDraft,
} from '@webapp/components/ai/UserAiSettingsPanel/ProviderDialog/providerDraft'

describe('isPlainHttpBaseUrl (366)', () => {
  test.each([
    'http://localhost:1234/v1',
    'https://llm.example.org/v1',
    'http://10.0.0.5:8000',
    'http://[::1]:1234/v1',
    'http://localhost:1234/v1/',
  ])('accepts %s', (url) => {
    expect(isPlainHttpBaseUrl(url)).toBe(true)
  })

  test.each([
    ['credentials', 'http://user:secret@localhost:1234/v1'],
    ['a user only', 'http://user@localhost:1234/v1'],
    ['an empty user', 'http://@localhost:1234/v1'],
    ['a query', 'http://localhost:1234/v1?key=abc'],
    ['an empty query', 'http://localhost:1234/v1?'],
    ['a fragment', 'http://localhost:1234/v1#frag'],
    ['an empty fragment', 'http://localhost:1234/v1#'],
    ['another scheme', 'ftp://localhost/v1'],
    ['a host disguised by credentials', 'http://localhost@evil.example.com/v1'],
    ['no scheme', 'localhost:1234/v1'],
    ['text', 'not a url'],
  ])('refuses %s', (_name, url) => {
    expect(isPlainHttpBaseUrl(url)).toBe(false)
  })
})

describe('local provider URLs are plain (366)', () => {
  test('normalizeLocalProviderBaseUrl refuses credentials, query and fragment, and keeps the rest', () => {
    expect(normalizeLocalProviderBaseUrl(' http://10.0.0.5:8000/v1// ')).toBe('http://10.0.0.5:8000/v1')
    expect(normalizeLocalProviderBaseUrl('http://u:p@10.0.0.5:8000/v1')).toBeNull()
    expect(normalizeLocalProviderBaseUrl('http://10.0.0.5:8000/v1?x=1')).toBeNull()
    expect(normalizeLocalProviderBaseUrl('http://10.0.0.5:8000/v1#top')).toBeNull()
  })

  test('a stored provider with such an address is kept, flagged, and never taken as valid', () => {
    const stored = [
      { id: 'local:a', name: 'Good', baseUrl: 'http://localhost:1234/v1', modelId: null },
      { id: 'local:b', name: 'Credentials', baseUrl: 'http://u:p@localhost:1234/v1', modelId: null },
      { id: 'local:c', name: 'Query', baseUrl: 'http://localhost:1234/v1?x=1', modelId: null },
    ]
    const storage = { getItem: () => JSON.stringify(stored), setItem: () => undefined }
    const providers = loadLocalProviders({ storage, userUuid: 'u1' })
    expect(providers.map((provider) => [provider.id, provider.addressInvalid === true])).toEqual([
      ['local:a', false],
      ['local:b', true],
      ['local:c', true],
    ])
  })

  test('the dialog draft of such an address is not usable', () => {
    const draft = (baseUrl: string) => ({ baseUrl }) as ProviderDraft
    expect(getLocalDraftUrl(draft('localhost:1234/v1'))).toBe('http://localhost:1234/v1')
    expect(getLocalDraftUrl(draft('user:pass@localhost:1234/v1'))).toBeNull()
    expect(getLocalDraftUrl(draft('localhost:1234/v1?x=1'))).toBeNull()
    expect(getLocalDraftUrl(draft('localhost:1234/v1#x'))).toBeNull()
  })
})
