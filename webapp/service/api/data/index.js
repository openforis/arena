import axios from 'axios'

// ==== READ
export const importRecordsFromCollect = async ({ surveyId, file, deleteAllRecords } = {}) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('deleteAllRecords', deleteAllRecords)

  const { data } = await axios.post(`/api/survey/${surveyId}/record/importfromcollect`, formData)
  const { job } = data
  return job
}
