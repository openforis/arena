import axios from 'axios'

export const sendGeoJsonToWhisp = async ({ surveyId, geoJSON }) => {
  const url = `/api/survey/${surveyId}/geo/whisp/geojson`
  const { data: token } = await axios.post(url, geoJSON)
  return { token }
}
