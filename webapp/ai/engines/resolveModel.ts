/**
 * Resolves the model of an AI request: engine selection (policy, data class, capabilities, preference),
 * first-use consent for the local server, then the model. Replaces A's gateway-only resolver.
 */
import type { LanguageModel } from 'ai'

import { type AiDataClass, type AiFeatureKey, getAiFeatureMinDataClass } from '@common/ai/features'
import type { AiHostingClass, AiPolicy } from '@common/ai/policy'
import SystemError, { StatusCodes } from '@core/systemError'

import { type AiFeatureSwitches, isAiFeatureEnabledInSettings } from './featureSwitches'
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

export type ResolveModelParams = {
  feature: AiFeatureKey
  surveyId?: number
  dataClass?: AiDataClass
  // aborting closes a pending consent dialog and rejects with an AbortError
  signal?: AbortSignal
}

export type ResolvedModel = { model: LanguageModel; engine: AiSelectedEngine }

export type ModelResolverDeps = {
  getUserUuid: () => string | null
  // the instance switch (system config); the user's own switches come from getSettings
  isInstanceEnabled: () => boolean
  // the AI settings of the loaded capabilities (null: not loaded or failed to load)
  getSettings: () => AiFeatureSwitches | null
  loadCapabilities: () => Promise<AiCapabilities>
  // survey policy within the ceilings (the ceilings alone for features without a survey); null fails closed
  getEffectivePolicy: (
    surveyId: number | undefined,
    capabilities: AiCapabilities,
    feature: AiFeatureKey
  ) => Promise<AiPolicy | null>
  getLocalSettings: () => AiLocalServerSettings
  storage: StorageLike | null
  requestConsent: (request: LocalServerConsentRequest, signal?: AbortSignal) => Promise<LocalServerConsentAnswer>
  onConsentChange: () => void
  createGatewayModel: GatewayModelFactory
  createLocalEngine: (localServer: AiLocalServerCapability) => Promise<AiEngine>
}

type Context = {
  userUuid: string | null
  signal?: AbortSignal
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
 * Builds the error of an aborted request (recognised by isAiAbortError).
 * @returns {DOMException} The error.
 */
const aborted = () => new DOMException('The request was aborted.', 'AbortError')

/**
 * Returns the address of the server the model is built from (normalized, from the capabilities).
 * @param {Context} context - Request context.
 * @returns {string} The base URL.
 */
const getServerBaseUrl = (context: Context): string => context.capabilities.localServer.baseUrl ?? ''

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
    userUuid: context.userUuid,
    surveyId: context.options.surveyId,
    baseUrl: getServerBaseUrl(context),
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
    const answer = await deps.requestConsent(
      {
        surveyId: context.options.surveyId,
        baseUrl: getServerBaseUrl(context),
        modelId: engine.model,
        hostingClass: engine.hostingClass,
        canUseOther: 'engine' in alternative,
      },
      context.signal
    )
    if (context.signal?.aborted) throw aborted()
    // logged out (or another user logged in) while the dialog was open: nothing is stored for the new user
    if (deps.getUserUuid() !== context.userUuid) throw consentCancelled()
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
   * Fails closed unless the instance, the user and the server allow the feature: a local engine never reaches
   * /api/ai/model, so the gate that route applies is applied here.
   * @param {string} feature - Feature key.
   * @throws {SystemError} aiFeaturesDisabled when the feature is switched off or the settings are unknown.
   */
  const assertFeatureEnabled = (feature: AiFeatureKey): void => {
    if (!deps.isInstanceEnabled()) throw new SystemError('aiFeaturesDisabled', { feature }, StatusCodes.NOT_FOUND)
    if (!isAiFeatureEnabledInSettings(deps.getSettings(), feature)) {
      throw new SystemError('aiFeaturesDisabled', { feature }, StatusCodes.FORBIDDEN)
    }
  }

  /**
   * Resolves the model of a request.
   * @param {ResolveModelParams} params - Feature, survey, optional data class and abort signal.
   * @returns {Promise<ResolvedModel>} The model and the engine.
   */
  return async ({ feature, surveyId, dataClass, signal }: ResolveModelParams): Promise<ResolvedModel> => {
    const userUuid = deps.getUserUuid()
    // an unknown feature is treated as the most sensitive class (getAiFeatureMinDataClass)
    const options: AiEngineModelOptions = {
      feature,
      dataClass: dataClass ?? getAiFeatureMinDataClass(feature),
      surveyId,
    }
    const capabilities = await deps.loadCapabilities()
    assertFeatureEnabled(feature)
    const effective = await deps.getEffectivePolicy(surveyId, capabilities, feature)
    if (signal?.aborted) throw aborted()
    const context: Context = {
      userUuid,
      signal,
      options,
      capabilities,
      effective,
      localSettings: deps.getLocalSettings(),
    }

    const consent = context.localSettings.enabled ? loadLocalServerConsent(consentParams(context)) : null
    const preferLocal = getEffectivePreferLocal({ settings: context.localSettings, consent })
    const engine = assertSelected(select(context, { preferLocal, withLocal: true }), options.dataClass)

    if (engine.id === 'gateway') return createWithGateway(context, engine)
    return consent === 'accepted' ? createWithLocal(context, engine) : askConsent(context, engine)
  }
}

let appResolver: ((params: ResolveModelParams) => Promise<ResolvedModel>) | null = null

/**
 * Returns the model and the engine for an AI request (app entry point; replaces A's gateway-only resolver).
 * The app wiring is loaded lazily: it imports the redux store, which the workflow unit tests must not load.
 * @param {ResolveModelParams} params - Feature, survey and optional data class (the assistant's conversation class).
 * @returns {Promise<ResolvedModel>} The model and the engine description.
 */
export const resolveModel = async (params: ResolveModelParams): Promise<ResolvedModel> => {
  if (!appResolver) {
    const { appModelResolverDeps } = await import('./appModelResolverDeps')
    appResolver = createModelResolver(appModelResolverDeps)
  }
  return appResolver(params)
}
