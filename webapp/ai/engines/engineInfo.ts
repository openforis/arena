/**
 * Engine descriptions (label, model, limits) built from the capabilities. No AI SDK import.
 */
import { getLocalServerContextWindow, getLocalServerLimits } from './localServerProbe'
import type { AiGatewayCapability, AiLocalServerCapability, AiSelectedEngine } from './types'

export const LOCAL_SERVER_LABEL = 'Local server'
export const GATEWAY_MAX_STEPS = 10
export const DEFAULT_GATEWAY_MAX_PROMPT_CHARS = 200000 // A's AI_MAX_PROMPT_CHARS default

const hostOf = (baseUrl: string): string => {
  try {
    return new URL(baseUrl).host
  } catch {
    return baseUrl
  }
}

/**
 * Returns the local server engine description, or null when no URL or hosting class is known.
 * @param {AiLocalServerCapability} localServer - Local server capability.
 * @param {string} [label] - Name of the local provider (default: "Local server", or the host of an organisation server).
 * @returns {AiSelectedEngine|null} The description.
 */
export const getLocalServerEngineInfo = (
  localServer: AiLocalServerCapability,
  label?: string
): AiSelectedEngine | null => {
  const { baseUrl, hostingClass } = localServer
  if (!baseUrl || !hostingClass) return null
  const defaultLabel = hostingClass === 'onDevice' ? LOCAL_SERVER_LABEL : hostOf(baseUrl)
  return {
    id: 'localServer',
    hostingClass,
    label: label ?? defaultLabel,
    model: localServer.modelId,
    limits: getLocalServerLimits(localServer.contextTokens),
    contextWindow: getLocalServerContextWindow(localServer.contextTokens),
  }
}

/**
 * Returns the gateway engine description, or null when its hosting class is unknown.
 * @param {AiGatewayCapability} gateway - Gateway capability.
 * @returns {AiSelectedEngine|null} The description.
 */
export const getGatewayEngineInfo = (gateway: AiGatewayCapability): AiSelectedEngine | null => {
  if (!gateway.hostingClass) return null
  return {
    id: 'gateway',
    hostingClass: gateway.hostingClass,
    label: gateway.provider ?? '',
    model: gateway.model,
    limits: { maxPromptChars: gateway.maxPromptChars ?? DEFAULT_GATEWAY_MAX_PROMPT_CHARS, maxSteps: GATEWAY_MAX_STEPS },
  }
}
