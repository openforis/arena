/**
 * Where the gateway sends the data: an organisation server (base URL on AI_ORG_HOSTED_BASE_URLS) or the cloud.
 * Used by the survey AI policy (step B). Local engines (on this device) are classified in the browser (step C).
 */
import { ENV } from '@core/processUtils'
import { AiProvider } from '@common/ai/aiProvider'

import { isAllowlisted } from './baseUrlGuard'

export type GatewayHostingClass = 'orgHosted' | 'cloud'

// only these providers send the data to a base URL chosen by the user or the admin
const providersWithBaseUrl = new Set<string>([AiProvider.openaiCompatible, AiProvider.vercelAiSdk])

/**
 * Parses a base URL, returning null when it is not a valid URL.
 * @param {string} baseUrl - Base URL to parse.
 * @returns {URL|null} The URL or null.
 */
const parseUrl = (baseUrl: string): URL | null => {
  try {
    return new URL(baseUrl)
  } catch {
    return null
  }
}

/**
 * Returns the hosting class of a provider config: orgHosted only when its base URL is allowlisted.
 * @param {object} params - Parameters.
 * @param {string} params.provider - Provider key.
 * @param {string|null} [params.baseUrl] - Configured base URL.
 * @param {string[]} [params.allowlist] - Org-hosted base URLs (defaults to AI_ORG_HOSTED_BASE_URLS).
 * @returns {GatewayHostingClass} The hosting class (built-in providers, the mock and unknown URLs are cloud).
 */
export const getProviderHostingClass = ({
  provider,
  baseUrl,
  allowlist = ENV.aiOrgHostedBaseUrls,
}: {
  provider: string
  baseUrl?: string | null
  allowlist?: string[]
}): GatewayHostingClass => {
  if (!providersWithBaseUrl.has(provider) || !baseUrl) return 'cloud'
  const url = parseUrl(baseUrl)
  if (!url) return 'cloud'
  return isAllowlisted(url, allowlist ?? []) ? 'orgHosted' : 'cloud'
}
