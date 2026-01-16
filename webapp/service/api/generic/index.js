import axios from 'axios'

export const fetchVersion = async () => {
  const {
    data: { version },
  } = await axios.get(`/api/version`)
  return version
}

export const downloadFileUrl = ({ downloadToken, fileType, fileFormat, surveyId = null, cycle = null }) => {
  const params = new URLSearchParams({ downloadToken, fileType, fileFormat, surveyId, cycle })
  return `/api/download?${params.toString()}`
}
