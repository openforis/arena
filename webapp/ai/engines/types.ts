/**
 * Types of the browser AI engines (gateway, local server) and of the engine selection.
 * Type-only module: UI code may import it without loading the AI SDK.
 */
import type { LanguageModel } from 'ai'

import type { AiDataClass, AiFeatureKey } from '@common/ai/features'
import type { AiHostingClass, AiPolicy } from '@common/ai/policy'

export type AiEngineId = 'gateway' | 'localServer' // 'builtIn' | 'webLlm' later (overview to-do list)

export type AiEngineLimits = { maxPromptChars: number; maxSteps: number }

export type AiEngineInfo = { id: AiEngineId; hostingClass: AiHostingClass; label: string; model: string | null }

// the engine chosen by selectEngine, with the limits the caller must respect
export type AiSelectedEngine = AiEngineInfo & { limits: AiEngineLimits }

export type AiEngineModelOptions = { feature: AiFeatureKey; dataClass: AiDataClass; surveyId?: number }

export type AiEngine = AiSelectedEngine & { createModel: (options: AiEngineModelOptions) => LanguageModel }

export type AiEngineErrorInfo = { key: string; params: Record<string, unknown> }

export type AiLocalServerCapability = {
  enabled: boolean
  reachable: boolean | null // null: not probed yet
  models: string[]
  hostingClass: AiHostingClass | null
  contextTokens: number | null
  baseUrl: string | null
  modelId: string | null
  error: AiEngineErrorInfo | null // why the last probe failed
}

export type AiGatewayCapability = {
  available: boolean
  hostingClass: AiHostingClass | null
  provider: string | null
  model: string | null
  maxPromptChars: number | null
}

// statistics only in C (used by the deferred builtIn/webLlm engines)
export type AiDeviceCapability = { webGpu: boolean; deviceMemoryGb: number | null; promptApi: string | null }

export type AiInstanceCapability = { policyCeilings: AiPolicy | null; orgHostedBaseUrls: string[] }

export type AiCapabilities = {
  localServer: AiLocalServerCapability
  gateway: AiGatewayCapability
  device: AiDeviceCapability
  instance: AiInstanceCapability
}

export type AiUnavailableReason =
  | 'localServerNotEnabled'
  | 'localServerUnreachable'
  | 'localServerNoModel'
  | 'gatewayNotConfigured'
  | 'policyForbidsCloud'
  | 'policyForbidsOrgHosted'
  | 'policyForbidsAll'

export type AiEngineSelection = { engine: AiSelectedEngine } | { unavailable: AiUnavailableReason[] }

export type AiLocalServerSettings = {
  enabled: boolean
  baseUrl: string
  modelId: string | null
  preferLocal: boolean
}

export type AiConsentDecision = 'accepted' | 'declined'

export type StorageLike = Pick<Storage, 'getItem' | 'setItem'>
