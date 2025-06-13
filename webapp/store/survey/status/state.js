import * as A from '@core/arena'
import * as SurveyState from '../state'

export const stateKey = 'status'

const keys = {
  fetched: 'fetched',
  dirty: 'dirty',
  draft: 'draft',
  includeAnalysis: 'includeAnalysis',
  validate: 'validate',
}

const getStatus = A.pipe(SurveyState.getSurvey, A.propOr({}, stateKey))

export const isFetched = A.pipe(getStatus, A.propOr(false, keys.fetched))

export const isDirty = A.pipe(getStatus, A.propOr(false, keys.dirty))

export const isDraft = A.pipe(getStatus, A.propOr(false, keys.draft))

export const isIncludeAnalysis = A.pipe(getStatus, A.propOr(false, keys.includeAnalysis))

export const isValidate = A.pipe(getStatus, A.propOr(false, keys.validate))

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

export const assocDefsFetched = ({ draft, includeAnalysis, validate }) =>
  A.pipe(
    A.assoc(keys.fetched, true),
    A.assoc(keys.draft, draft),
    A.assoc(keys.includeAnalysis, includeAnalysis),
    A.assoc(keys.validate, validate)
  )

export const resetDefsFetched = () => ({})
