import axios from 'axios'

import * as Survey from '@core/survey/survey'

import { objectToFormData } from '../utils/apiUtils'

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

export const fetchSurveyFull = async ({
  surveyId,
  cycle,
  draft = true,
  advanced = false,
  includeAnalysis = false,
  validate = false,
} = {}) => {
  const {
    data: { survey },
  } = await axios.get(`/api/survey/${surveyId}/full`, { params: { cycle, draft, advanced, includeAnalysis, validate } })
  return survey
}

export const fetchSurveyTemplatesPublished = async () => {
  const {
    data: { list: surveys },
  } = await axios.get(`/api/surveyTemplates`)
  return surveys
}

// ==== UPDATE
export const startImportLabelsJob = async ({ surveyId, file }) => {
  const formData = objectToFormData({ file })

  const { data: job } = await axios.put(`/api/survey/${surveyId}/labels`, formData)
  return job
}
