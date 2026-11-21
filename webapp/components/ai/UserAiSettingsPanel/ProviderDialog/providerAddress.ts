/**
 * The base URL rules of the add / edit provider dialog: an address on this computer or network is a Local server,
 * an Organisation server must be on the allowlist. Pure.
 */
import { isLocalOrPrivateUrl, isOrgHostedUrl } from '@common/ai/localServerAddress'

import type { ProviderTypeSpec } from './providerTypes'

type AddressParams = { spec: ProviderTypeSpec; baseUrl: string; allowlist: string[] }

/**
 * Returns true when an account base URL points to this computer or the local network (and is not an org server):
 * the Arena server cannot reach it, a Local server can.
 * @param {AddressParams} params - Type spec, typed base URL and the org-hosted base URLs.
 * @returns {boolean} True when the hint shows.
 */
export const shouldShowLocalUrlHint = ({ spec, baseUrl, allowlist }: AddressParams): boolean =>
  spec.kind === 'account' &&
  spec.value !== 'orgServer' &&
  spec.requiresBaseUrl &&
  isLocalOrPrivateUrl(baseUrl) &&
  !isOrgHostedUrl(baseUrl, allowlist)

/**
 * Returns true when an Organisation server URL is typed but not on the allowlist.
 * @param {AddressParams} params - Type spec, typed base URL and the org-hosted base URLs.
 * @returns {boolean} True when the URL is refused.
 */
export const isOrgServerUrlRefused = ({ spec, baseUrl, allowlist }: AddressParams): boolean =>
  spec.value === 'orgServer' && !!baseUrl.trim() && !isOrgHostedUrl(baseUrl, allowlist)

/**
 * Returns true when the account draft has a base URL the server may call (or needs none).
 * @param {AddressParams} params - Type spec, typed base URL and the org-hosted base URLs.
 * @returns {boolean} True when usable.
 */
export const isAccountBaseUrlUsable = (params: AddressParams): boolean =>
  !params.spec.requiresBaseUrl ||
  (!!params.baseUrl.trim() && !shouldShowLocalUrlHint(params) && !isOrgServerUrlRefused(params))
