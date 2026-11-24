import axios from 'axios'

const getUrl = ({ surveyId }: { surveyId: number }): string => `/api/survey/${surveyId}/rstudio`

export const getCurrentInstance = async ({ surveyId }: { surveyId: number }) => {
  const { data = {} } = await axios.get(getUrl({ surveyId }))
  const { instance = {} } = data
  return instance
}

// CREATE
export const createInstance = async ({ surveyId }: { surveyId: number }) => {
  const { data = {} } = await axios.post(getUrl({ surveyId }))
  const { instanceId = false, rStudioProxyUrl = false } = data
  return { instanceId, rStudioProxyUrl }
}

// DELETE
export const terminateInstance = ({ surveyId, instanceId }: { surveyId: number; instanceId: string }) =>
  axios.delete(getUrl({ surveyId }), { params: { instanceId } })
