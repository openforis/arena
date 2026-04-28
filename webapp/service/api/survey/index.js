import axios from 'axios'

import * as Survey from '@core/survey/survey'
import { FileUtils } from '@webapp/utils/fileUtils'
import { objectToFormData } from '../utils/apiUtils'

// ==== CREATE
export const insertSurvey = async ({ newSurvey }) => {
  const { name, label, lang, cloneFrom = null, cloneFromCycle = null, template = false } = newSurvey
  const { data } = await axios.post('/api/survey', { name, label, lang, cloneFrom, cloneFromCycle, template })
  return data
}

export const insertSurveyFile = async ({ surveyId, file, surveyFile }) => {
  const formData = objectToFormData({ surveyFile: JSON.stringify(surveyFile), file })
  await axios.post(`/api/survey/${surveyId}/file`, formData)
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

export const getSurveyFileDownloadUrl = ({ surveyId, fileUuid }) => `/api/survey/${surveyId}/file/${fileUuid}`

export const fetchSurveyFile = async ({ surveyId, fileUuid }) => {
  const response = await axios.get(getSurveyFileDownloadUrl({ surveyId, fileUuid }), { responseType: 'blob' })
  return response
}

export const getSurveyDocxExportUrl = ({ surveyId, cycle, lang, draft = false }) =>
  `/api/survey/${surveyId}/export/docx?${new URLSearchParams({ draft, cycle, lang })}`

// ==== UPDATE
export const startImportLabelsJob = async ({ surveyId, file }) => {
  const fileFormat = FileUtils.determineFileFormatFromFileName(file.name)
  const formData = objectToFormData({ file, fileFormat })
  const { data: job } = await axios.put(`/api/survey/${surveyId}/labels`, formData)
  return job
}

export const updateSurveyConfigurationProp = async ({ surveyId, key, value }) => {
  const formData = objectToFormData({ key, value })
  const { data } = await axios.put(`/api/survey/${surveyId}/config`, formData)
  return data
}

export const updateSurveyOwner = async ({ surveyId, ownerUuid }) => {
  const { data } = await axios.put(`/api/survey/${surveyId}/owner`, { ownerUuid })
  return data
}

export const updateSurveyProps = async ({ surveyId, props }) => {
  const { data } = await axios.put(`/api/survey/${surveyId}/info`, props)
  return data
}

// surveys list export
export const startSurveysListExportJob = async ({ draft = true, template = false } = {}) => {
  const {
    data: { job },
  } = await axios.post(`/api/surveys/export`, { draft, template })
  return { job }
}

export const getSurveyListExportedFileDownloadUrl = ({ tempFileName }) =>
  `/api/surveys/export/download?${new URLSearchParams({ tempFileName })}`
