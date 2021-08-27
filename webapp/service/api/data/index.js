import axios from 'axios'

// ==== READ
export const importRecordsFromCollect = async ({ surveyId, file, deleteAllRecords, cycle, forceImport = false } = {}) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('deleteAllRecords', deleteAllRecords)
  formData.append('cycle', cycle)
  formData.append('forceImport', forceImport)

  const { data } = await axios.post(`/api/survey/${surveyId}/record/importfromcollect`, formData)
  const { job } = data
  return job
}
