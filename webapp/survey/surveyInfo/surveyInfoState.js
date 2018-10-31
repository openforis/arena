import * as R from 'ramda'

export const setPublished = (published = true) => R.assoc('published', published)

export const markDraft = R.assoc('draft', true)

/**
 * ======
 * UPDATE
 * ======
 */
export const assocSurveyInfoProp = (key, value) => R.pipe(
  R.assocPath(['props', key], value),
  // reset validation
  R.dissocPath(['validation', 'fields', key]),
  //set as draft
  markDraft,
)

export const assocSurveyInfoValidation = (validation) => R.assoc('validation', validation)