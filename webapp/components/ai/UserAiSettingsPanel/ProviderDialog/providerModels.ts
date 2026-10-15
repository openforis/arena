/**
 * The model list of the add / edit provider dialog: which model the draft keeps once the list is fetched, and the
 * options of the Local server's Model select. Pure.
 */
import type { LocalServerTestView } from '@webapp/ai/engines/localServerTest'

import { isAccountBaseUrlUsable } from './providerAddress'
import type { ProviderDraft } from './providerDraft'
import { isApiKeyMissing, type KeyParams } from './providerKey'

// the value of the model select that switches to a typed model id
export const OTHER_MODEL_VALUE = '__other__'

export type AiModel = {
  id: string
  description?: string
}

/**
 * Returns the model to keep after the list was fetched.
 * @param {object} params - Parameters.
 * @param {string} params.model - Model in the draft.
 * @param {AiModel[]} params.models - Listed models.
 * @returns {string} The model when listed, else the first listed (unchanged for an empty list).
 */
export const chooseListedModel = ({ model, models }: { model: string; models: AiModel[] }): string =>
  models.some((listed) => listed.id === model) ? model : (models[0]?.id ?? model)

/**
 * Returns the model and the free-text flag to keep after the list was fetched: a typed ("Other") or saved model that
 * is not listed stays (OpenRouter, Azure deployments), only an empty one takes the first listed model.
 * @param {object} params - Parameters.
 * @param {ProviderDraft} params.draft - Draft now.
 * @param {AiModel[]} params.models - Listed models.
 * @returns {{model: string, modelFreeText: boolean}} The model and whether it is typed.
 */
export const resolveFetchedModel = ({
  draft,
  models,
}: {
  draft: ProviderDraft
  models: AiModel[]
}): { model: string; modelFreeText: boolean } => {
  if (draft.modelFreeText) return { model: draft.model, modelFreeText: true }
  if (!draft.model.trim()) return { model: chooseListedModel({ model: '', models }), modelFreeText: false }
  const listed = models.some((candidate) => candidate.id === draft.model)
  return { model: draft.model, modelFreeText: !listed }
}

/**
 * Returns true when the model list of an account draft can be requested.
 * @param {object} params - Spec, draft and saved provider, and the org-hosted base URLs.
 * @returns {boolean} True when the list can be fetched.
 */
export const canListModels = ({ spec, draft, saved, allowlist }: KeyParams & { allowlist: string[] }): boolean =>
  spec.kind === 'account' &&
  spec.supportsModelList &&
  isAccountBaseUrlUsable({ spec, baseUrl: draft.baseUrl, allowlist }) &&
  !isApiKeyMissing({ spec, draft, saved })

/**
 * Returns the model to choose after a local test.
 * @param {object} params - Parameters.
 * @param {boolean} params.reachable - The server answered.
 * @param {string[]} params.models - Models it lists.
 * @param {string} params.model - Chosen model.
 * @returns {string} The chosen model when listed, else the first listed one; unchanged when unreachable.
 */
export const pickLocalModel = ({
  reachable,
  models,
  model,
}: {
  reachable: boolean
  models: string[]
  model: string
}): string => {
  if (!reachable || models.includes(model)) return model
  return models[0] ?? model
}

/**
 * Returns the options of the local Model select.
 * @param {object} params - Parameters.
 * @param {LocalServerTestView|null} params.view - Result shown.
 * @param {string} params.model - Chosen model.
 * @returns {string[]} The listed models, with the chosen one first when it is not listed.
 */
export const listLocalModels = ({ view, model }: { view: LocalServerTestView | null; model: string }): string[] => {
  const listed = view?.models ?? []
  return model && !listed.includes(model) ? [model, ...listed] : listed
}
