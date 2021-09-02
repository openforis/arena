import axios from 'axios'

export const getCurrentInstance = async () => {
  const { data = {} } = await axios.get('/api/rstudio')
  const { instance = {} } = data
  return instance
}

// CREATE
export const createInstance = async () => {
  const { data = {} } = await axios.post('/api/rstudio')
  const { instanceId = false, rStudioProxyUrl = false } = data
  return { instanceId, rStudioProxyUrl }
}

// DELETE
export const terminateInstance = async ({ instanceId }) => axios.delete('/api/rstudio', { params: { instanceId } })
