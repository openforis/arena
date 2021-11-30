import axios from 'axios'

// ==== READ

export const fetchChains = async ({ surveyId, params } = {}) => {
  const {
    data: { list: chains },
  } = await axios.get(`/api/survey/${surveyId}/processing-chains`, { params })
  return { chains }
}
