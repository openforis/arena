/**
 * The test of the add / edit provider dialog: which values a result belongs to, whether it passed, and its text. A
 * provider is saved only after a passing test of the current values. Pure.
 */
import { getLocalServerTestView, type LocalServerTestView } from '@webapp/ai/engines/localServerTest'
import type { AiLocalServerCapability } from '@webapp/ai/engines/types'
import type { AiProviderTestResponse } from '@webapp/service/api/ai/providers'

import { getErrorText, type TFunction } from '../aiSettingsForm'
import { isAccountBaseUrlUsable, shouldShowLocalUrlHint } from './providerAddress'
import {
  createDraft,
  getDraftModel,
  getLocalDraftUrl,
  isSameBaseUrl,
  type ProviderDraft,
  trimUrl,
} from './providerDraft'
import { isApiKeyMissing, type KeyParams } from './providerKey'
import { getProviderTypeSpec, type ProviderTypeSpec, type SavedProvider } from './providerTypes'

// the test of one set of values (key: buildTestKey of the tested draft)
export type DraftTest = { key: string; account: AiProviderTestResponse | null; local: LocalServerTestView | null }

/**
 * Returns the key of the values a test runs on; the key edit counter stands for the typed key.
 * @param {object} params - Parameters.
 * @param {ProviderTypeSpec} params.spec - Type spec.
 * @param {ProviderDraft} params.draft - Draft.
 * @returns {string} The key.
 */
export const buildTestKey = ({ spec, draft }: { spec: ProviderTypeSpec; draft: ProviderDraft }): string => {
  // a local test lists the models: picking another listed model needs no new test
  if (spec.kind === 'local') return ['local', getLocalDraftUrl(draft) ?? ''].join('|')
  return [spec.value, trimUrl(draft.baseUrl), getDraftModel({ spec, draft }) ?? '', `k${draft.apiKeyVersion}`].join('|')
}

/**
 * Returns true when the test ran on the current values and passed.
 * @param {object} params - Parameters.
 * @param {DraftTest|null} params.test - Last test.
 * @param {ProviderTypeSpec} params.spec - Type spec.
 * @param {ProviderDraft} params.draft - Draft now.
 * @returns {boolean} True when it passed.
 */
export const isTestPassed = ({
  test,
  spec,
  draft,
}: {
  test: DraftTest | null
  spec: ProviderTypeSpec
  draft: ProviderDraft
}): boolean => {
  if (!test || test.key !== buildTestKey({ spec, draft })) return false
  if (spec.kind === 'local') {
    const view = test.local
    return !!view?.reachable && !!draft.model && view.models.includes(draft.model)
  }
  return !!test.account?.ok
}

/**
 * Returns true when Test can run on the draft.
 * @param {object} params - Spec, draft and saved provider, and the org-hosted base URLs.
 * @returns {boolean} True when the draft is complete enough to test.
 */
export const canTestDraft = ({ spec, draft, saved, allowlist }: KeyParams & { allowlist: string[] }): boolean => {
  if (spec.kind === 'local') return getLocalDraftUrl(draft) !== null
  return isAccountBaseUrlUsable({ spec, baseUrl: draft.baseUrl, allowlist }) && !isApiKeyMissing({ spec, draft, saved })
}

/**
 * Returns the test of a saved local provider from the app's last probe of it, so the edit dialog opens with its
 * result and a model change needs no new test.
 * @param {object} params - Parameters.
 * @param {SavedProvider|null} params.saved - Saved provider.
 * @param {AiLocalServerCapability|null} params.capability - Its capability (capabilities.local[id]).
 * @param {string[]} params.allowlist - Org-hosted base URLs.
 * @param {string} params.pageProtocol - Protocol of the Arena page.
 * @returns {DraftTest|null} The test, or null when the server was not probed.
 */
export const getInitialLocalTest = ({
  saved,
  capability,
  allowlist,
  pageProtocol,
}: {
  saved: SavedProvider | null
  capability: AiLocalServerCapability | null
  allowlist: string[]
  pageProtocol: string
}): DraftTest | null => {
  if (saved?.kind !== 'local' || !saved.baseUrl || !capability || capability.reachable === null) return null
  // the probe belongs to the saved address; another address is not its result
  if (!isSameBaseUrl(capability.baseUrl, saved.baseUrl)) return null
  const { reachable, models, contextTokens, error } = capability
  const draft = createDraft({ type: 'local', saved })
  return {
    key: buildTestKey({ spec: getProviderTypeSpec('local'), draft }),
    account: null,
    local: getLocalServerTestView({
      probe: { reachable, models, contextTokens, error },
      baseUrl: saved.baseUrl,
      allowlist,
      pageProtocol,
    }),
  }
}

/**
 * Returns the result of a test request that failed (the network, or a status the route answers with an error key).
 * @param {*} error - Axios error.
 * @returns {AiProviderTestResponse} A failed result with the error key and message, if any.
 */
export const toFailedTestResult = (error: any): AiProviderTestResponse => {
  const data = error?.response?.data
  return { ok: false, latencyMs: 0, errorMessage: error?.message, errorKey: data?.key, errorParams: data?.params }
}

/**
 * Returns the text of an account test result; a refused local URL gets the hint to add a Local server.
 * @param {object} params - Parameters.
 * @param {AiProviderTestResponse} params.result - Result.
 * @param {ProviderTypeSpec} params.spec - Type spec.
 * @param {string} params.baseUrl - Tested base URL.
 * @param {string[]} params.allowlist - Org-hosted base URLs.
 * @param {TFunction} params.t - Translation function.
 * @returns {string} The text.
 */
export const getAccountTestMessage = ({
  result,
  spec,
  baseUrl,
  allowlist,
  t,
}: {
  result: AiProviderTestResponse
  spec: ProviderTypeSpec
  baseUrl: string
  allowlist: string[]
  t: TFunction
}): string => {
  if (result.ok) return t('userAiSettings:dialog.testOk', { latencyMs: result.latencyMs })
  const key = (result.errorKey ?? '').replace(/^appErrors:/, '')
  if (key === 'aiBaseUrlNotAllowed' && shouldShowLocalUrlHint({ spec, baseUrl, allowlist })) {
    return t('userAiSettings:dialog.localUrlHint')
  }
  return getErrorText({ key, params: result.errorParams, message: result.errorMessage, t })
}
