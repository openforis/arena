/**
 * Resolves the model of an AI request: one provider (the request's, else the user's default; never another one),
 * the policy check, first-use consent for a local provider, then the model.
 */
import type { LanguageModel } from 'ai'

import { type AiDataClass, type AiFeatureKey, getAiFeatureMinDataClass, getMaxAiDataClass } from '@common/ai/features'
import type { AiHostingClass, AiPolicy } from '@common/ai/policy'
import SystemError, { StatusCodes } from '@core/systemError'

import { OFF_POLICY } from '@webapp/ai/policy/effectivePolicy'

import { type AiFeatureSwitches, isAiFeatureEnabledInSettings } from './featureSwitches'
import { createGatewayEngine, type GatewayModelFactory } from './gatewayEngine'
import { loadLocalServerConsent, saveLocalServerConsent } from './localServerConsent'
import { selectEngine } from './selectEngine'
import type {
  AiCapabilities,
  AiEngine,
  AiEngineModelOptions,
  AiEngineSelection,
  AiLocalServerCapability,
  AiSelectedEngine,
  StorageLike,
} from './types'

export { OFF_POLICY }

export type LocalServerConsentRequest = {
  surveyId?: number
  baseUrl: string
  modelId: string | null
  hostingClass: AiHostingClass
}

// chooseOther: the user wants another provider; the request fails so the UI can offer the switcher or the settings
export type LocalServerConsentAnswer = 'continue' | 'chooseOther' | 'cancel'

export type ResolveModelParams = {
  feature: AiFeatureKey
  surveyId?: number
  dataClass?: AiDataClass
  // the conversation's provider; the default when absent or no longer in the list
  providerId?: string
  // aborting closes a pending consent dialog and rejects with an AbortError
  signal?: AbortSignal
}

// policy: the effective policy the engine was selected with (the turn offers its tools by the same one); always set
// by the resolver, optional so that a caller's own resolver (tests) need not give one
export type ResolvedModel = { model: LanguageModel; engine: AiSelectedEngine; policy?: AiPolicy }

export type ModelResolverDeps = {
  getUserUuid: () => string | null
  // the instance switch (system config); the user's own switches come from getSettings
  isInstanceEnabled: () => boolean
  // the AI settings of the loaded capabilities (null: not loaded or failed to load)
  getSettings: () => AiFeatureSwitches | null
  loadCapabilities: () => Promise<AiCapabilities>
  // getEffectivePolicyFor: survey policy within the ceilings (the ceilings alone for features without a survey);
  // null fails closed. fresh: read from the server now, not from the cache
  getEffectivePolicyFor: (params: {
    feature: AiFeatureKey
    surveyId: number | undefined
    fresh?: boolean
  }) => Promise<AiPolicy | null>
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
}

/**
 * Builds the error for a closed or unusable consent card.
 * @returns {SystemError} The error.
 */
const consentCancelled = () => new SystemError('aiLocalServerConsentCancelled', {}, StatusCodes.CONFLICT)

/**
 * Builds the error for "Choose another provider" in the consent card.
 * @returns {SystemError} The error.
 */
const chooseAnother = () => new SystemError('aiProviderChooseAnother', {}, StatusCodes.CONFLICT)

/**
 * Builds the error of an aborted request (recognised by isAiAbortError).
 * @returns {DOMException} The error.
 */
export const aborted = () => new DOMException('The request was aborted.', 'AbortError')

/**
 * Builds the error of a request whose provider cannot be used.
 * @param {AiEngineSelection} selection - The failed selection (or a single reason).
 * @param {AiDataClass} dataClass - Data class of the request.
 * @returns {SystemError} aiNoEngineAvailable with the reasons.
 */
const noEngine = (selection: { unavailable: string[] }, dataClass: AiDataClass) =>
  new SystemError('aiNoEngineAvailable', { reasons: selection.unavailable, dataClass }, StatusCodes.CONFLICT)

/**
 * Returns the selected engine, or throws aiNoEngineAvailable with the reason.
 * @param {AiEngineSelection} selection - The selection.
 * @param {AiDataClass} dataClass - Data class of the request.
 * @returns {AiSelectedEngine} The engine.
 */
const assertSelected = (selection: AiEngineSelection, dataClass: AiDataClass): AiSelectedEngine => {
  if ('engine' in selection) return selection.engine
  throw noEngine(selection, dataClass)
}

/**
 * Returns the probe-based capability of the selected local provider.
 * @param {Context} context - Request context.
 * @param {AiSelectedEngine} engine - The selected local engine.
 * @returns {AiLocalServerCapability} The capability.
 */
const getLocalCapability = (context: Context, engine: AiSelectedEngine): AiLocalServerCapability => {
  const capability = engine.providerId ? context.capabilities.local[engine.providerId] : undefined
  if (!capability) throw noEngine({ unavailable: ['notAvailable'] }, context.options.dataClass)
  return capability
}

/**
 * Creates the model resolver.
 * @param {ModelResolverDeps} deps - Capabilities, policy, settings, consent and model factories.
 * @returns {Function} resolve({ feature, surveyId?, dataClass?, providerId? }) → Promise<{ model, engine }>.
 */
export const createModelResolver = (deps: ModelResolverDeps) => {
  /**
   * Returns the consent storage parameters of the request (the local provider's normalized base URL).
   * @param {Context} context - Request context.
   * @param {AiLocalServerCapability} capability - The local provider's capability.
   * @returns {object} Storage, user, survey and base URL.
   */
  const consentParams = (context: Context, capability: AiLocalServerCapability) => ({
    storage: deps.storage,
    userUuid: context.userUuid,
    surveyId: context.options.surveyId,
    baseUrl: capability.baseUrl ?? '',
  })

  /**
   * Creates the model with the gateway engine of the provider.
   * @param {Context} context - Request context.
   * @param {AiSelectedEngine} engine - The selected gateway engine.
   * @param {AiPolicy} policy - The effective policy the engine was selected with.
   * @returns {ResolvedModel} The model, the engine and the policy.
   */
  const createWithGateway = (context: Context, engine: AiSelectedEngine, policy: AiPolicy): ResolvedModel => {
    const gatewayEngine = createGatewayEngine({ engine, createGatewayModel: deps.createGatewayModel })
    return { model: gatewayEngine.createModel(context.options), engine, policy }
  }

  /**
   * Creates the model with the local server engine of the provider.
   * @param {Context} context - Request context.
   * @param {AiSelectedEngine} engine - The selected local engine.
   * @param {AiLocalServerCapability} capability - Its capability.
   * @param {AiPolicy} policy - The effective policy the engine was selected with.
   * @returns {Promise<ResolvedModel>} The model, the engine and the policy.
   */
  const createWithLocal = async (
    context: Context,
    engine: AiSelectedEngine,
    capability: AiLocalServerCapability,
    policy: AiPolicy
  ): Promise<ResolvedModel> => {
    const localEngine = await deps.createLocalEngine(capability)
    return { model: localEngine.createModel(context.options), engine, policy }
  }

  /**
   * Asks the user to confirm the local provider; only Continue goes on (no other provider is tried).
   * @param {Context} context - Request context.
   * @param {AiSelectedEngine} engine - The selected local engine.
   * @param {AiLocalServerCapability} capability - Its capability.
   * @returns {Promise<void>} Resolves on Continue.
   * @throws {SystemError} aiProviderChooseAnother for "Choose another provider", aiLocalServerConsentCancelled otherwise.
   */
  const askConsent = async (
    context: Context,
    engine: AiSelectedEngine,
    capability: AiLocalServerCapability
  ): Promise<void> => {
    const answer = await deps.requestConsent(
      {
        surveyId: context.options.surveyId,
        baseUrl: consentParams(context, capability).baseUrl,
        modelId: engine.model,
        hostingClass: engine.hostingClass,
      },
      context.signal
    )
    if (context.signal?.aborted) throw aborted()
    // logged out (or another user logged in) while the dialog was open: nothing is stored for the new user
    if (deps.getUserUuid() !== context.userUuid) throw consentCancelled()
    if (answer === 'chooseOther') throw chooseAnother()
    if (answer !== 'continue') throw consentCancelled()
  }

  /**
   * Selects the engine again from fresh inputs, right before a local model is created: the server never sees a
   * local request, so this is the last policy check. The dialog may have been open for a long time, and the policy,
   * the provider settings or the user may have changed meanwhile.
   * @param {Context} context - Request context.
   * @param {AiSelectedEngine} engine - The local engine the request (and the consent) is about.
   * @param {AiLocalServerCapability} capability - Its capability when it was selected.
   * @returns {Promise<{engine: AiSelectedEngine, capability: AiLocalServerCapability, policy: AiPolicy}>} What to create the model from.
   * @throws {SystemError} aiNoEngineAvailable when the policy or the provider no longer allows it,
   * aiLocalServerConsentCancelled when the provider is no longer the one that was confirmed.
   */
  const recheckLocal = async (context: Context, engine: AiSelectedEngine, capability: AiLocalServerCapability) => {
    const { options } = context
    const capabilities = await deps.loadCapabilities()
    const policy = await deps.getEffectivePolicyFor({
      feature: options.feature,
      surveyId: options.surveyId,
      fresh: true,
    })
    if (context.signal?.aborted) throw aborted()
    if (deps.getUserUuid() !== context.userUuid) throw consentCancelled()
    const selected = assertSelected(
      selectEngine({ effective: policy, dataClass: options.dataClass, capabilities, providerId: engine.providerId }),
      options.dataClass
    )
    const current = selected.providerId ? capabilities.local[selected.providerId] : undefined
    const same =
      selected.id === 'localServer' &&
      selected.providerId === engine.providerId &&
      selected.hostingClass === engine.hostingClass &&
      current?.baseUrl === capability.baseUrl
    if (!same || !current) throw consentCancelled()
    // selectEngine selected an engine, so the policy is not null
    return { engine: selected, capability: current, policy: policy ?? OFF_POLICY }
  }

  /**
   * Creates the model of a local provider: asks first when this survey has no consent for its URL, then checks the
   * policy again (a local request is never checked by the server).
   * @param {Context} context - Request context.
   * @param {AiSelectedEngine} engine - The selected local engine.
   * @returns {Promise<ResolvedModel>} The model and the engine.
   */
  const resolveLocal = async (context: Context, engine: AiSelectedEngine): Promise<ResolvedModel> => {
    const capability = getLocalCapability(context, engine)
    // a decline stored by the older dialog counts as not asked: there is no other provider to fall back to
    const consented = loadLocalServerConsent(consentParams(context, capability)) === 'accepted'
    if (!consented) await askConsent(context, engine, capability)
    const checked = await recheckLocal(context, engine, capability)
    if (!consented) {
      saveLocalServerConsent({ ...consentParams(context, checked.capability), decision: 'accepted' })
      deps.onConsentChange()
    }
    return createWithLocal(context, checked.engine, checked.capability, checked.policy)
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
   * @param {ResolveModelParams} params - Feature, survey, optional data class, provider and abort signal.
   * @returns {Promise<ResolvedModel>} The model and the engine.
   */
  return async ({ feature, surveyId, dataClass, providerId, signal }: ResolveModelParams): Promise<ResolvedModel> => {
    const userUuid = deps.getUserUuid()
    // a caller can raise the class, never lower it below what the feature needs (an unknown feature needs the most
    // sensitive class)
    const minDataClass = getAiFeatureMinDataClass(feature)
    const options: AiEngineModelOptions = {
      feature,
      dataClass: getMaxAiDataClass(minDataClass, dataClass ?? minDataClass),
      surveyId,
    }
    const capabilities = await deps.loadCapabilities()
    assertFeatureEnabled(feature)
    const effective = await deps.getEffectivePolicyFor({ feature, surveyId })
    if (signal?.aborted) throw aborted()
    const context: Context = { userUuid, signal, options, capabilities }
    const selection = selectEngine({ effective, dataClass: options.dataClass, capabilities, providerId })
    const engine = assertSelected(selection, options.dataClass)
    return engine.id === 'gateway'
      ? createWithGateway(context, engine, effective ?? OFF_POLICY)
      : resolveLocal(context, engine)
  }
}

let appResolver: ((params: ResolveModelParams) => Promise<ResolvedModel>) | null = null

/**
 * Returns the model and the engine for an AI request (app entry point).
 * The app wiring is loaded lazily: it imports the redux store, which the workflow unit tests must not load.
 * @param {ResolveModelParams} params - Feature, survey, optional data class (the assistant's conversation class) and provider.
 * @returns {Promise<ResolvedModel>} The model and the engine description.
 */
export const resolveModel = async (params: ResolveModelParams): Promise<ResolvedModel> => {
  if (!appResolver) {
    const { appModelResolverDeps } = await import('./appModelResolverDeps')
    appResolver = createModelResolver(appModelResolverDeps)
  }
  return appResolver(params)
}
