import { getLocalConsentRevokeState } from '@webapp/components/ai/UserAiSettingsPanel/ProviderDialog/localConsentRevokeState'

describe('local consent revoke line (379)', () => {
  const stored = new Set(['http://a:1234/v1'])
  const hasConsent = (url: string) => stored.has(url)

  test('shows nothing when adding a provider', () => {
    expect(getLocalConsentRevokeState({ baseUrl: null, revokedBaseUrl: null, hasConsent })).toBe('none')
  })

  test('follows the address when the dialog switches to another provider', () => {
    expect(getLocalConsentRevokeState({ baseUrl: 'http://a:1234/v1', revokedBaseUrl: null, hasConsent })).toBe(
      'revocable'
    )
    expect(getLocalConsentRevokeState({ baseUrl: 'http://b:1234/v1', revokedBaseUrl: null, hasConsent })).toBe('none')
  })

  test('picks up a permission stored after the dialog opened', () => {
    const late = new Set<string>()
    const has = (url: string) => late.has(url)
    expect(getLocalConsentRevokeState({ baseUrl: 'http://c:1234/v1', revokedBaseUrl: null, hasConsent: has })).toBe(
      'none'
    )
    late.add('http://c:1234/v1')
    expect(getLocalConsentRevokeState({ baseUrl: 'http://c:1234/v1', revokedBaseUrl: null, hasConsent: has })).toBe(
      'revocable'
    )
  })

  test('the revoked message belongs to the address that was revoked only', () => {
    const revokedBaseUrl = 'http://a:1234/v1'
    expect(getLocalConsentRevokeState({ baseUrl: 'http://a:1234/v1', revokedBaseUrl, hasConsent })).toBe('revoked')
    expect(getLocalConsentRevokeState({ baseUrl: 'http://b:1234/v1', revokedBaseUrl, hasConsent })).toBe('none')
  })
})
