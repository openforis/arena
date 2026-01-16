import axios from 'axios'
import { Objects } from '@openforis/arena-core'

export const fetchVersion = async () => {
  const {
    data: { version },
  } = await axios.get(`/api/version`)
  return version
}

export const downloadFileUrl = ({ downloadToken, fileType, fileFormat, surveyId = null, cycle = null }) => {
  const params = { downloadToken, fileType, fileFormat, surveyId, cycle }
  const cleanParams = Objects.deleteEmptyProps(params)
  const searchParams = new URLSearchParams(cleanParams)
  return `/api/download?${searchParams.toString()}`
}
