import * as A from '@core/arena'
import * as SurveyState from '../state'

export const stateKey = 'status'

const keys = {
  fetched: 'fetched',
  dirty: 'dirty',
  draft: 'draft',
  includeAnalysis: 'includeAnalysis',
  validate: 'validate',
  loadCount: 'loadCount',
}

const getStatus = A.pipe(SurveyState.getSurvey, A.propOr({}, stateKey))

export const isFetched = A.pipe(getStatus, A.propOr(false, keys.fetched))

export const isDirty = A.pipe(getStatus, A.propOr(false, keys.dirty))

export const isDraft = A.pipe(getStatus, A.propOr(false, keys.draft))

export const isIncludeAnalysis = A.pipe(getStatus, A.propOr(false, keys.includeAnalysis))

export const isValidate = A.pipe(getStatus, A.propOr(false, keys.validate))

// incremented by every defs load and kept by a reset: a reset and a reload in one render still make a new
// suggestion generation
export const getDefsLoadCount = A.pipe(getStatus, A.propOr(0, keys.loadCount))

/**
 * Returns the defs load count of a status.
 * @param {object} status - Survey status.
 * @returns {number} The count.
 */
const getStatusLoadCount = (status) => status?.[keys.loadCount] ?? 0

export const isFetchedWithSameParams =
  ({ draft = false, includeAnalysis = true, validate = false }) =>
  (state) =>
    isFetched(state) &&
    draft === isDraft(state) &&
    includeAnalysis === isIncludeAnalysis(state) &&
    validate === isValidate(state)

// ====== UPDATE
export const assocDirty = A.assoc(keys.dirty, true)
export const dissocDirty = A.dissoc(keys.dirty)

/**
 * Marks the defs fetched with their params and counts the load.
 * @param {object} params - Load params.
 * @param {boolean} params.draft - Draft defs.
 * @param {boolean} params.includeAnalysis - Analysis defs included.
 * @param {boolean} params.validate - Defs validated.
 * @returns {function(object): object} The status updater.
 */
export const assocDefsFetched =
  ({ draft, includeAnalysis, validate }) =>
  (status) =>
    A.pipe(
      A.assoc(keys.fetched, true),
      A.assoc(keys.draft, draft),
      A.assoc(keys.includeAnalysis, includeAnalysis),
      A.assoc(keys.validate, validate),
      A.assoc(keys.loadCount, getStatusLoadCount(status) + 1)
    )(status)

/**
 * Returns the status of unfetched defs (the load count stays).
 * @param {object} status - Survey status.
 * @returns {object} The status.
 */
export const resetDefsFetched = (status) => ({ [keys.loadCount]: getStatusLoadCount(status) })
