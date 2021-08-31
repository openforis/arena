import axios from 'axios'

// ==== READ
export const importRecordsFromCollect = async ({
  surveyId,
  file,
  deleteAllRecords,
  cycle,
  forceImport = false,
} = {}) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('deleteAllRecords', deleteAllRecords)
  formData.append('cycle', cycle)
  formData.append('forceImport', forceImport)

  const { data } = await axios.post(`/api/survey/${surveyId}/record/importfromcollect`, formData)
  const { job } = data
  return job
}

export const updateRecordsStep = async ({ surveyId, stepFrom, stepTo }) => {
  const {
    data: { count },
  } = await axios.post(`/api/survey/${surveyId}/records/step`, { stepFrom, stepTo })
  return { count }
}
