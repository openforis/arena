import axios from 'axios'

import type { ArenaSurvey } from '@openforis/arena-core'

import * as Survey from '@core/survey/survey'
import { FileUtils } from '@webapp/utils/fileUtils'
import { objectToFormData } from '../utils/apiUtils'

// ==== CREATE
export const insertSurvey = async ({
  newSurvey,
}: {
  newSurvey: {
    name: string
    label: string
    lang: string
    cloneFrom?: number | null
    cloneFromCycle?: string | null
    template?: boolean
  }
}) => {
  const { name, label, lang, cloneFrom = null, cloneFromCycle = null, template = false } = newSurvey
  const { data } = await axios.post('/api/survey', { name, label, lang, cloneFrom, cloneFromCycle, template })
  return data
}

export const insertSurveyFile = async ({
  surveyId,
  file,
  surveyFile,
}: {
  surveyId: number
  file: File
  surveyFile: object
}) => {
  const formData = objectToFormData({ surveyFile: JSON.stringify(surveyFile), file })
  await axios.post(`/api/survey/${surveyId}/file`, formData)
}

// ==== READ
export const fetchSurveys = async ({
  draft = true,
  template = false,
  withChains = false,
}: { draft?: boolean; template?: boolean; withChains?: boolean } = {}): Promise<ArenaSurvey[]> => {
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
}: {
  surveyId: number
  cycle?: string
  draft?: boolean
  advanced?: boolean
  includeAnalysis?: boolean
  validate?: boolean
  updateUserPrefs?: boolean
}): Promise<ArenaSurvey> => {
  const {
    data: { survey },
  } = await axios.get(`/api/survey/${surveyId}/full`, {
    params: { cycle, draft, advanced, includeAnalysis, validate, updateUserPrefs },
  })
  return survey
}

// same survey data downloaded by Arena Mobile (with reference data)
export const fetchSurveyForMobile = async ({
  surveyId,
  cycle,
  draft = true,
}: {
  surveyId: number
  cycle: string
  draft?: boolean
}) => {
  const {
    data: { survey },
  } = await axios.get(`/api/mobile/survey/${surveyId}`, { params: { cycle, draft } })
  return survey
}

export const fetchSurveyTemplatesPublished = async () => {
  const {
    data: { list: surveys },
  } = await axios.get(`/api/surveyTemplates`)
  return surveys
}

// survey id can be a route param (string)
export const getSurveyFileDownloadUrl = ({ surveyId, fileUuid }: { surveyId: number | string; fileUuid: string }) =>
  `/api/survey/${surveyId}/file/${fileUuid}`

export const fetchSurveyFile = async ({
  surveyId,
  fileUuid,
  errorHandledLocally = false,
}: {
  surveyId: number | string
  fileUuid: string
  errorHandledLocally?: boolean
}) => {
  const response = await axios.get(getSurveyFileDownloadUrl({ surveyId, fileUuid }), {
    responseType: 'blob',
    // when true, the global service error notification is skipped (see appErrorsMiddleware)
    errorHandledLocally,
  })
  return response
}

type SurveyDocExportUrlParams = { surveyId: number; cycle: string; lang: string; draft?: boolean }

export const getSurveyDocxExportUrl = ({ surveyId, cycle, lang, draft = true }: SurveyDocExportUrlParams) =>
  `/api/survey/${surveyId}/export/docx?${new URLSearchParams({ draft: String(draft), cycle, lang })}`

export const getSurveyPdfExportUrl = ({ surveyId, cycle, lang, draft = true }: SurveyDocExportUrlParams) =>
  `/api/survey/${surveyId}/export/pdf?${new URLSearchParams({ draft: String(draft), cycle, lang })}`

// ==== UPDATE
export const startImportLabelsJob = async ({ surveyId, file }: { surveyId: number; file: File }) => {
  const fileFormat = FileUtils.determineFileFormatFromFileName(file.name)
  const formData = objectToFormData({ file, fileFormat })
  const { data: job } = await axios.put(`/api/survey/${surveyId}/labels`, formData)
  return job
}

export const updateSurveyConfigurationProp = async ({
  surveyId,
  key,
  value,
}: {
  surveyId: number
  key: string
  value: string
}) => {
  const formData = objectToFormData({ key, value })
  const { data } = await axios.put(`/api/survey/${surveyId}/config`, formData)
  return data
}

export const updateSurveyOwner = async ({ surveyId, ownerUuid }: { surveyId: number; ownerUuid: string }) => {
  const { data } = await axios.put(`/api/survey/${surveyId}/owner`, { ownerUuid })
  return data
}

export const updateSurveyProps = async ({ surveyId, props }: { surveyId: number; props: object }) => {
  const { data } = await axios.put(`/api/survey/${surveyId}/info`, props)
  return data
}

// surveys list export
export const startSurveysListExportJob = async ({
  draft = true,
  template = false,
}: { draft?: boolean; template?: boolean } = {}) => {
  const {
    data: { job },
  } = await axios.post(`/api/surveys/export`, { draft, template })
  return { job }
}

/**
 * Fetches the node defs of the schema summary that need an AI description.
 * @returns {Promise<{surveyName: string, nodeDefs: any[]}>} The items.
 */
export const fetchSchemaSummaryAiItems = async ({
  surveyId,
  cycle,
  signal,
}: {
  surveyId: number
  cycle: string
  signal?: AbortSignal
}) => {
  // errorHandledLocally: the progress dialog shows the error
  const { data } = await axios.get(`/api/survey/${surveyId}/schema-summary/ai-items`, {
    params: { cycle },
    signal,
    errorHandledLocally: true,
  })
  return data
}

export const getSurveyListExportedFileDownloadUrl = ({ tempFileName }: { tempFileName: string }) =>
  `/api/surveys/export/download?${new URLSearchParams({ tempFileName })}`

/**
 * Starts the schema summary export with the AI descriptions generated in the browser.
 * @param {object} params - Params.
 * @param {string} params.fileFormat - csv or xlsx.
 * @param {Record<string, string>} params.aiDescriptions - AI descriptions by node def uuid. The request checks their
 * shape and size; a uuid that is not a node def of the export fails the job (aiDescriptionsInvalid), not the request.
 * @param {number} [params.aiDescriptionsFailedCount] - Node defs left without a description.
 * @param {number} [params.aiDescriptionsNotDoneCount] - Node defs a stop kept the run from describing.
 * @returns {Promise<{job: object}>} The started job.
 */
export const startSchemaSummaryExportJob = async ({
  surveyId,
  cycle,
  fileFormat,
  aiDescriptions,
  aiDescriptionsFailedCount = 0,
  aiDescriptionsNotDoneCount = 0,
  signal,
}: {
  surveyId: number
  cycle: string
  fileFormat: string
  aiDescriptions: Record<string, string>
  aiDescriptionsFailedCount?: number
  aiDescriptionsNotDoneCount?: number
  signal?: AbortSignal
}) => {
  const {
    data: { job },
  } = await axios.post(
    `/api/survey/${surveyId}/schema-summary/export`,
    { cycle, fileFormat, aiDescriptions, aiDescriptionsFailedCount, aiDescriptionsNotDoneCount },
    // the progress dialog shows the error
    { errorHandledLocally: true, signal }
  )
  return { job }
}
