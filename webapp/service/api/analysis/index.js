import axios from 'axios'

// ==== READ

export const fetchChains = async ({ surveyId, surveyCycleKey = null } = {}) => {
  const {
    data: { list: chains },
  } = await axios.get(
    `/api/survey/${surveyId}/processing-chains`,
    surveyCycleKey ? { params: { surveyCycleKey } } : undefined
  )
  return { chains }
}

export const fetchChainsForCloneFromSurvey = async ({ targetSurveyId, sourceSurveyId }) => {
  const {
    data: { list: chains },
  } = await axios.get(`/api/survey/${targetSurveyId}/chain/clone-from-survey/chains`, {
    params: { sourceSurveyId },
  })
  return { chains }
}

export const fetchChainSourceEntityNames = async ({ targetSurveyId, sourceSurveyId, sourceChainUuid }) => {
  const {
    data: { entityNames },
  } = await axios.get(`/api/survey/${targetSurveyId}/chain/clone-from-survey/entities`, {
    params: { sourceSurveyId, sourceChainUuid },
  })
  return { entityNames }
}

export const getChainSummaryExportUrl = ({ surveyId, chainUuid }) =>
  `/api/survey/${surveyId}/chain/${chainUuid}/summary`

// ==== CLONE

export const cloneChainFromSurvey = async ({
  targetSurveyId,
  sourceSurveyId,
  sourceChainUuid,
  skipMissingEntityAttributes = false,
}) => {
  const { data: chain } = await axios.post(`/api/survey/${targetSurveyId}/chain/clone-from-survey`, {
    sourceSurveyId,
    sourceChainUuid,
    skipMissingEntityAttributes,
  })
  return chain
}

// ==== DELETE

export const deleteChain = async ({ surveyId, chainUuid }) => {
  await axios.delete(`/api/survey/${surveyId}/chain/${chainUuid}`)
}
