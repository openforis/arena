/**
 * Types of the browser AI engines (gateway, local server) and of the engine selection.
 * Type-only module: UI code may import it without loading the AI SDK.
 */
import type { LanguageModel } from 'ai'

import type { AiDataClass, AiFeatureKey } from '@common/ai/features'
import type { AiHostingClass, AiPolicy } from '@common/ai/policy'
import type { AiProviderKind } from '@common/ai/providerIds'

export type AiEngineId = 'gateway' | 'localServer' // 'builtIn' | 'webLlm' later (overview to-do list)

export type AiEngineLimits = { maxPromptChars: number; maxSteps: number }

// context size of the engine's model, in tokens; assumed: the default size, the server didn't report it
export type AiContextWindow = { tokens: number; assumed: boolean }

// the one description of an engine: what selectEngine chooses for a request (and the UI shows), with the limits the
// caller must respect (contextWindow: local server only); providerId: the provider it calls (every gateway request
// names it)
export type AiSelectedEngine = {
  id: AiEngineId
  hostingClass: AiHostingClass
  label: string
  model: string | null
  limits: AiEngineLimits
  contextWindow?: AiContextWindow
  providerId?: string
}

export type AiEngineModelOptions = { feature: AiFeatureKey; dataClass: AiDataClass; surveyId?: number }

// what creates the model of a selected engine; it describes nothing (AiSelectedEngine does)
export type AiEngine = { createModel: (options: AiEngineModelOptions) => LanguageModel }

export type AiEngineErrorInfo = { key: string; params: Record<string, unknown> }

export type AiLocalServerCapability = {
  reachable: boolean | null // null: not probed yet
  models: string[]
  hostingClass: AiHostingClass | null
  contextTokens: number | null
  baseUrl: string | null
  modelId: string | null
  error: AiEngineErrorInfo | null // why the last probe failed
}

// maxPromptChars: the gateway prompt cap of the instance (AI_MAX_PROMPT_CHARS), null when unknown
export type AiInstanceCapability = {
  policyCeilings: AiPolicy | null
  orgHostedBaseUrls: string[]
  maxPromptChars: number | null
}

export type AiProviderStatus = 'ready' | 'notTested' | 'notAvailable' | 'notSetUp'

// one provider the user can pick (spec section 1); hostingClass null: not known (not set up, invalid URL)
export type AiProviderEntry = {
  id: string
  kind: AiProviderKind
  type: string
  name: string
  model: string | null
  baseUrl: string | null
  hostingClass: AiHostingClass | null
  status: AiProviderStatus
  // a local provider whose stored address is not a plain http(s) URL: never called, and says why
  addressInvalid?: boolean
}

export type AiCapabilities = {
  instance: AiInstanceCapability
  // account providers, then local providers, then Arena default
  providers: AiProviderEntry[]
  defaultProviderId: string
  // the probe of each local provider, by id
  local: Record<string, AiLocalServerCapability>
}

// why the one provider of a request cannot be used (no fallback: there is never a second candidate)
export type AiUnavailableReason =
  'policyForbids' | 'notAvailable' | 'missingOnThisBrowser' | 'notSetUp' | 'invalidAddress'

export type AiEngineSelection = { engine: AiSelectedEngine } | { unavailable: AiUnavailableReason[] }

export type AiLocalServerSettings = {
  enabled: boolean
  baseUrl: string
  modelId: string | null
  preferLocal: boolean
}

export type AiConsentDecision = 'accepted' | 'declined'

export type StorageLike = Pick<Storage, 'getItem' | 'setItem'>

// the conversion of the old local server settings removes the old key
export type RemovableStorage = StorageLike & Pick<Storage, 'removeItem'>
