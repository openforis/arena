import * as R from 'ramda'

export const paramsChain = {
  surveyId: 'surveyId',
  chainUuid: 'chainUuid',
  // READ
  includeScript: 'includeScript',
}

export const getSurveyId = R.prop(paramsChain.surveyId)
export const getChainUuid = R.prop(paramsChain.chainUuid)
export const getIncludeScripts = R.propOr(false, paramsChain.includeScript)
