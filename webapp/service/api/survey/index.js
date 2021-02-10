import axios from 'axios'
import * as Survey from '@core/survey/survey'

// ==== READ
export const fetchSurveys = async () => {
  const {
    data: { list: surveys },
  } = await axios.get(`/api/surveys`)
  return surveys.map(Survey.getSurveyInfo)
}
