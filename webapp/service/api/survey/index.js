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
export const fetchSurveys = async ({ draft = true, template = false, withChains = false } = {}) => {
  const {
    data: { list: surveys },
  } = await axios.get(`/api/surveys`, { params: { draft, template, withChains } })
  return surveys.map(Survey.getSurveyInfo)
}

export const fetchSurveyFull = async ({
  surveyId,
  cycle,
  draft = true,
  advanced = false,
  includeAnalysis = false,
  validate = false,
  updateUserPrefs = false,
} = {}) => {
  const {
    data: { survey },
  } = await axios.get(`/api/survey/${surveyId}/full`, {
    params: { cycle, draft, advanced, includeAnalysis, validate, updateUserPrefs },
  })
  return survey
}

export const fetchSurveyTemplatesPublished = async () => {
  const {
    data: { list: surveys },
  } = await axios.get(`/api/surveyTemplates`)
  return surveys
}

export const getSurveyFileDownloadUrl = ({ surveyId, fileUuid }) => `/api/survey/${surveyId}/file/${fileUuid}`

export const fetchSurveyFile = async ({ surveyId, fileUuid, errorHandledLocally = false }) => {
  const response = await axios.get(getSurveyFileDownloadUrl({ surveyId, fileUuid }), {
    responseType: 'blob',
    // when true, the global service error notification is skipped (see appErrorsMiddleware)
    errorHandledLocally,
  })
  return response
}

export const getSurveyDocxExportUrl = ({ surveyId, cycle, lang, draft = true }) =>
  `/api/survey/${surveyId}/export/docx?${new URLSearchParams({ draft, cycle, lang })}`

export const getSurveyPdfExportUrl = ({ surveyId, cycle, lang, draft = true }) =>
  `/api/survey/${surveyId}/export/pdf?${new URLSearchParams({ draft, cycle, lang })}`

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

/**
 * Fetches the node defs of the schema summary that need an AI description.
 * @param {object} params - Params.
 * @param {number} params.surveyId - Survey id.
 * @param {string} params.cycle - Cycle key.
 * @param {AbortSignal} [params.signal] - Cancellation signal.
 * @returns {Promise<{surveyName: string, nodeDefs: object[]}>} The items.
 */
export const fetchSchemaSummaryAiItems = async ({ surveyId, cycle, signal }) => {
  // errorHandledLocally: the progress dialog shows the error
  const { data } = await axios.get(`/api/survey/${surveyId}/schema-summary/ai-items`, {
    params: { cycle },
    signal,
    errorHandledLocally: true,
  })
  return data
}

export const getSurveyListExportedFileDownloadUrl = ({ tempFileName }) =>
  `/api/surveys/export/download?${new URLSearchParams({ tempFileName })}`

/**
 * Starts the schema summary export with the AI descriptions generated in the browser.
 * @param {object} params - Params.
 * @param {number} params.surveyId - Survey id.
 * @param {string} params.cycle - Cycle key.
 * @param {string} params.fileFormat - csv or xlsx.
 * @param {Record<string, string>} params.aiDescriptions - AI descriptions by node def uuid. The request checks their
 * shape and size; a uuid that is not a node def of the export fails the job (aiDescriptionsInvalid), not the request.
 * @param {number} [params.aiDescriptionsFailedCount] - Node defs left without a description.
 * @param {AbortSignal} [params.signal] - Cancellation signal.
 * @returns {Promise<{job: object}>} The started job.
 */
export const startSchemaSummaryExportJob = async ({
  surveyId,
  cycle,
  fileFormat,
  aiDescriptions,
  aiDescriptionsFailedCount = 0,
  signal,
}) => {
  const {
    data: { job },
  } = await axios.post(
    `/api/survey/${surveyId}/schema-summary/export`,
    { cycle, fileFormat, aiDescriptions, aiDescriptionsFailedCount },
    // the progress dialog shows the error
    { errorHandledLocally: true, signal }
  )
  return { job }
}
