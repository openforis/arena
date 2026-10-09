/**
 * Resolves the model of an AI request: engine selection (policy, data class, capabilities, preference),
 * first-use consent for the local server, then the model. Replaces A's resolveGatewayModel.
 */
import type { LanguageModel } from 'ai'

import { type AiDataClass, type AiFeatureKey, getAiFeature } from '@common/ai/features'
import type { AiHostingClass, AiPolicy } from '@common/ai/policy'
import SystemError, { StatusCodes } from '@core/systemError'

import { createGatewayEngine, type GatewayModelFactory } from './gatewayEngine'
import { getEffectivePreferLocal, loadLocalServerConsent, saveLocalServerConsent } from './localServerConsent'
import { selectEngine } from './selectEngine'
import type {
  AiCapabilities,
  AiEngine,
  AiEngineModelOptions,
  AiEngineSelection,
  AiLocalServerCapability,
  AiLocalServerSettings,
  AiSelectedEngine,
  StorageLike,
} from './types'

export type LocalServerConsentRequest = {
  surveyId?: number
  baseUrl: string
  modelId: string | null
  hostingClass: AiHostingClass
  canUseOther: boolean
}

export type LocalServerConsentAnswer = 'continue' | 'useOther' | 'cancel'

export type ResolveModelParams = { feature: AiFeatureKey; surveyId?: number; dataClass?: AiDataClass }

export type ResolvedModel = { model: LanguageModel; engine: AiSelectedEngine }

export type ModelResolverDeps = {
  getUserUuid: () => string | null
  loadCapabilities: () => Promise<AiCapabilities>
  // survey policy within the ceilings (the ceilings alone without a survey); null fails closed
  getEffectivePolicy: (surveyId: number | undefined, capabilities: AiCapabilities) => Promise<AiPolicy | null>
  getLocalSettings: () => AiLocalServerSettings
  storage: StorageLike | null
  requestConsent: (request: LocalServerConsentRequest) => Promise<LocalServerConsentAnswer>
  onConsentChange: () => void
  createGatewayModel: GatewayModelFactory
  createLocalEngine: (localServer: AiLocalServerCapability) => Promise<AiEngine>
}

type Context = {
  options: AiEngineModelOptions
  capabilities: AiCapabilities
  effective: AiPolicy | null
  localSettings: AiLocalServerSettings
}

/**
 * Builds the error for a closed or unusable consent card.
 * @returns {SystemError} The error.
 */
const consentCancelled = () => new SystemError('aiLocalServerConsentCancelled', {}, StatusCodes.CONFLICT)

/**
 * Runs the engine selection, optionally ignoring the local server.
 * @param {Context} context - Request context.
 * @param {object} params - Parameters.
 * @param {boolean} params.preferLocal - Local server first.
 * @param {boolean} params.withLocal - False to select without the local server.
 * @returns {AiEngineSelection} The selection.
 */
const select = (context: Context, { preferLocal, withLocal }: { preferLocal: boolean; withLocal: boolean }) => {
  const { capabilities, effective, options } = context
  const usable = withLocal
    ? capabilities
    : { ...capabilities, localServer: { ...capabilities.localServer, enabled: false } }
  return selectEngine({ effective, dataClass: options.dataClass, capabilities: usable, prefs: { preferLocal } })
}

/**
 * Returns the selected engine, or throws aiNoEngineAvailable with the reasons.
 * @param {AiEngineSelection} selection - The selection.
 * @param {AiDataClass} dataClass - Data class of the request.
 * @returns {AiSelectedEngine} The engine.
 */
const assertSelected = (selection: AiEngineSelection, dataClass: AiDataClass): AiSelectedEngine => {
  if ('engine' in selection) return selection.engine
  throw new SystemError('aiNoEngineAvailable', { reasons: selection.unavailable, dataClass }, StatusCodes.CONFLICT)
}

/**
 * Creates the model resolver.
 * @param {ModelResolverDeps} deps - Capabilities, policy, settings, consent and model factories.
 * @returns {Function} resolve({ feature, surveyId?, dataClass? }) → Promise<{ model, engine }>.
 */
export const createModelResolver = (deps: ModelResolverDeps) => {
  /**
   * Returns the consent storage parameters of the request (normalized base URL from the settings).
   * @param {Context} context - Request context.
   * @returns {object} Storage, user, survey and base URL.
   */
  const consentParams = (context: Context) => ({
    storage: deps.storage,
    userUuid: deps.getUserUuid(),
    surveyId: context.options.surveyId,
    baseUrl: context.localSettings.baseUrl,
  })

  /**
   * Creates the model with the gateway engine.
   * @param {Context} context - Request context.
   * @param {AiSelectedEngine} engine - The selected gateway engine.
   * @returns {ResolvedModel} The model and the engine.
   */
  const createWithGateway = (context: Context, engine: AiSelectedEngine): ResolvedModel => {
    const gatewayEngine = createGatewayEngine({
      gateway: context.capabilities.gateway,
      createGatewayModel: deps.createGatewayModel,
    })
    return { model: gatewayEngine.createModel(context.options), engine }
  }

  /**
   * Creates the model with the local server engine.
   * @param {Context} context - Request context.
   * @param {AiSelectedEngine} engine - The selected local engine.
   * @returns {Promise<ResolvedModel>} The model and the engine.
   */
  const createWithLocal = async (context: Context, engine: AiSelectedEngine): Promise<ResolvedModel> => {
    const localEngine = await deps.createLocalEngine(context.capabilities.localServer)
    return { model: localEngine.createModel(context.options), engine }
  }

  /**
   * Stores the consent decision and notifies the listeners.
   * @param {Context} context - Request context.
   * @param {string} decision - accepted or declined.
   */
  const storeDecision = (context: Context, decision: 'accepted' | 'declined') => {
    saveLocalServerConsent({ ...consentParams(context), decision })
    deps.onConsentChange()
  }

  /**
   * Asks the user to confirm the local server and acts on the answer.
   * @param {Context} context - Request context.
   * @param {AiSelectedEngine} engine - The selected local engine.
   * @returns {Promise<ResolvedModel>} The model and the engine.
   * @throws {SystemError} aiLocalServerConsentCancelled when the card is closed or has no alternative.
   */
  const askConsent = async (context: Context, engine: AiSelectedEngine): Promise<ResolvedModel> => {
    const alternative = select(context, { preferLocal: false, withLocal: false })
    const answer = await deps.requestConsent({
      surveyId: context.options.surveyId,
      baseUrl: context.localSettings.baseUrl,
      modelId: engine.model,
      hostingClass: engine.hostingClass,
      canUseOther: 'engine' in alternative,
    })
    if (answer === 'continue') {
      storeDecision(context, 'accepted')
      return createWithLocal(context, engine)
    }
    if (answer === 'useOther' && 'engine' in alternative) {
      storeDecision(context, 'declined')
      return createWithGateway(context, alternative.engine)
    }
    throw consentCancelled()
  }

  /**
   * Resolves the model of a request.
   * @param {ResolveModelParams} params - Feature, survey and optional data class.
   * @returns {Promise<ResolvedModel>} The model and the engine.
   */
  return async ({ feature, surveyId, dataClass }: ResolveModelParams): Promise<ResolvedModel> => {
    // an unknown feature is treated as the most sensitive class
    const options: AiEngineModelOptions = {
      feature,
      dataClass: dataClass ?? getAiFeature(feature)?.dataClass ?? 'data',
      surveyId,
    }
    const capabilities = await deps.loadCapabilities()
    const effective = await deps.getEffectivePolicy(surveyId, capabilities)
    const context: Context = { options, capabilities, effective, localSettings: deps.getLocalSettings() }

    const consent = context.localSettings.enabled ? loadLocalServerConsent(consentParams(context)) : null
    const preferLocal = getEffectivePreferLocal({ settings: context.localSettings, consent })
    const engine = assertSelected(select(context, { preferLocal, withLocal: true }), options.dataClass)

    if (engine.id === 'gateway') return createWithGateway(context, engine)
    return consent === 'accepted' ? createWithLocal(context, engine) : askConsent(context, engine)
  }
}
