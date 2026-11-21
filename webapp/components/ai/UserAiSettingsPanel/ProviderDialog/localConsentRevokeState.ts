export type LocalConsentRevokeState = 'none' | 'revocable' | 'revoked'

/**
 * What the revoke line shows for the saved server. It is derived from the current address on every render, so
 * switching to another provider (or saving a new address) shows that server's permission, not the one at mount.
 * @param {object} params - Parameters.
 * @param {string|null} params.baseUrl - The saved URL of the provider being edited; null when adding one.
 * @param {string|null} params.revokedBaseUrl - The address whose permission the user just took back, if any.
 * @param {Function} params.hasConsent - Whether a permission is stored for the given address.
 * @returns {LocalConsentRevokeState} 'revoked' right after taking it back, 'revocable' when one is stored, else 'none'.
 */
export const getLocalConsentRevokeState = ({
  baseUrl,
  revokedBaseUrl,
  hasConsent,
}: {
  baseUrl: string | null
  revokedBaseUrl: string | null
  hasConsent: (baseUrl: string) => boolean
}): LocalConsentRevokeState => {
  if (!baseUrl) return 'none'
  if (revokedBaseUrl === baseUrl) return 'revoked'
  return hasConsent(baseUrl) ? 'revocable' : 'none'
}
