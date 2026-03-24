import axios from 'axios'

// ==== READ

export const fetchChains = async ({ surveyId, surveyCycleKey = null } = {}) => {
  const {
    data: { list: chains },
  } = await axios.get(`/api/survey/${surveyId}/processing-chains`, { params: { surveyCycleKey } })
  return { chains }
}

export const getChainSummaryExportUrl = ({ surveyId, chainUuid }) =>
  `/api/survey/${surveyId}/chain/${chainUuid}/summary`
