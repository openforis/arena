import axios from 'axios'

const _generateUrl =
  ({ instanceId, rStudioProxyUrl }) =>
  ({ userUuid }) =>
    instanceId && rStudioProxyUrl ? `${rStudioProxyUrl}${instanceId}_${userUuid}` : false

export const getCurrentInstance = async () => {
  const { data = {} } = await axios.get('/api/rstudio')
  const { instance = {}, rStudioProxyUrl = false } = data

  const getRStudioUrl = _generateUrl({ instanceId: instance?.instanceId, rStudioProxyUrl })
  return { instance, getRStudioUrl, rStudioProxyUrl }
}

// CREATE
export const createInstance = async () => {
  const { data = {} } = await axios.post('/api/rstudio')
  const { instanceId = false, rStudioProxyUrl = false } = data
  const getRStudioUrl = _generateUrl({ instanceId, rStudioProxyUrl })
  return { instanceId, rStudioProxyUrl, getRStudioUrl }
}

// DELETE
export const terminateInstance = async ({ instanceId }) => axios.delete('/api/rstudio', { params: { instanceId } })
