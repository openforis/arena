/**
 * What the settings panel shows after "Test connection" of the local AI server. Pure.
 */
import type { AiHostingClass } from '@common/ai/policy'
import { getLocalServerHostingClass, getTargetAddressSpace } from '@common/ai/localServerAddress'

import type { LocalServerProbeResult } from './localServerProbe'
import type { AiEngineErrorInfo } from './types'

export type LocalServerTestView = {
  reachable: boolean
  models: string[]
  hostingClass: AiHostingClass
  contextTokens: number | null
  error: AiEngineErrorInfo | null
  // HTTPS page, plain-HTTP server on the local network: mixed content unless the browser has Local Network Access
  showHttpsHint: boolean
  // not on this device and not on the allowlist: the policy treats it as a cloud service
  showCloudWarning: boolean
}

const isPlainHttp = (url: string): boolean => {
  try {
    return new URL(url).protocol === 'http:'
  } catch {
    return false
  }
}

/**
 * Returns the test result view.
 * @param {object} params - Parameters.
 * @param {LocalServerProbeResult} params.probe - Probe result.
 * @param {string} params.baseUrl - Tested URL.
 * @param {string[]} params.allowlist - Org-hosted base URLs.
 * @param {string} params.pageProtocol - Protocol of the Arena page (`window.location.protocol`).
 * @returns {LocalServerTestView} The view.
 */
export const getLocalServerTestView = ({
  probe,
  baseUrl,
  allowlist,
  pageProtocol,
}: {
  probe: LocalServerProbeResult
  baseUrl: string
  allowlist: string[]
  pageProtocol: string
}): LocalServerTestView => {
  const hostingClass = getLocalServerHostingClass(baseUrl, allowlist)
  const lanOverHttp = getTargetAddressSpace(baseUrl) === 'local' && isPlainHttp(baseUrl)
  return {
    reachable: probe.reachable,
    models: probe.models,
    hostingClass,
    contextTokens: probe.contextTokens,
    error: probe.error,
    showHttpsHint: !probe.reachable && pageProtocol === 'https:' && lanOverHttp,
    showCloudWarning: hostingClass === 'cloud',
  }
}
