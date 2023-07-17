import axios from 'axios'

import * as Survey from '@core/survey/survey'

// ==== CREATE
export const insertSurvey = async ({ newSurvey }) => {
  const { name, label, lang, cloneFrom = null, cloneFromCycle = null, template = false } = newSurvey
  const { data } = await axios.post('/api/survey', { name, label, lang, cloneFrom, cloneFromCycle, template })
  return data
}

// ==== READ
export const fetchSurveys = async ({ draft = true, template = false } = {}) => {
  const {
    data: { list: surveys },
  } = await axios.get(`/api/surveys`, { params: { draft, template } })
  return surveys.map(Survey.getSurveyInfo)
}

export const fetchSurveyTemplatesPublished = async () => {
  const {
    data: { list: surveys },
  } = await axios.get(`/api/surveyTemplates`)
  return surveys
}
