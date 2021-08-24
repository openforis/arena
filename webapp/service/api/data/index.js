import axios from 'axios'

// ==== READ
export const importRecordsFromCollect = async ({ surveyId, file, deleteAllRecords, cycle } = {}) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('deleteAllRecords', deleteAllRecords)
  formData.append('cycle', cycle)

  const { data } = await axios.post(`/api/survey/${surveyId}/record/importfromcollect`, formData)
  const { job } = data
  return job
}
