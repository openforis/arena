import axios from 'axios'
import * as Survey from '@core/survey/survey'

// ==== READ
export const fetchSurveys = async ({ draft = true, template = false } = {}) => {
  const {
    data: { list: surveys },
  } = await axios.get(`/api/surveys`, { params: { draft, template } })
  return surveys.map(Survey.getSurveyInfo)
}
