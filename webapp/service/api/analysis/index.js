import axios from 'axios'

import { objectToFormData } from '../utils/apiUtils'

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

export const fetchChainMauFileSummary = async ({ surveyId, chainUuid }) => {
  const {
    data: { file },
  } = await axios.get(`/api/survey/${surveyId}/chain/${chainUuid}/mau`)
  return file
}

export const getChainMauFileDownloadUrl = ({ surveyId, chainUuid }) =>
  `/api/survey/${surveyId}/chain/${chainUuid}/mau/content`

// ==== CREATE/UPDATE

export const uploadChainMauFile = async ({ surveyId, chainUuid, file }) => {
  const formData = objectToFormData({ file })
  const {
    data: { file: uploadedFile },
  } = await axios.post(`/api/survey/${surveyId}/chain/${chainUuid}/mau`, formData)
  return uploadedFile
}

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

export const deleteChainMauFile = async ({ surveyId, chainUuid }) => {
  await axios.delete(`/api/survey/${surveyId}/chain/${chainUuid}/mau`)
}
