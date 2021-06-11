import axios from 'axios'

// ==== READ
export const importRecordsFromCollect = async ({ surveyId, file } = {}) => {
  const formData = new FormData()
  formData.append('file', file)

  const { data } = await axios.post(`/api/survey/${surveyId}/record/importfromcollect`, formData)
  const { job } = data
  return job
}
