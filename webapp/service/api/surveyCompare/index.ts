import axios from 'axios'

import { objectToFormData } from '../utils/apiUtils'

/**
 * Starts the comparison of the survey with an uploaded survey file (or with the one uploaded before).
 * @param {object} params - Parameters.
 * @param {number} params.surveyId - Id of the survey to compare.
 * @param {File} [params.file] - Arena survey export file (zip).
 * @param {string} [params.sourceFileName] - Temp file name of a survey file uploaded before.
 * @param {Record<string, string>} [params.manualMatches] - Node defs matched by the user (target uuid by source uuid).
 * @returns {Promise<object>} - The started job.
 */
export const startSurveyCompareJob = async ({
  surveyId,
  file = undefined,
  sourceFileName = undefined,
  manualMatches = {},
}: {
  surveyId: number
  file?: File
  sourceFileName?: string
  manualMatches?: Record<string, string>
}): Promise<{ job: any }> => {
  const formData = file ? objectToFormData({ file }) : { sourceFileName, manualMatches: JSON.stringify(manualMatches) }
  const { data } = await axios.post(`/api/survey/${surveyId}/compare`, formData)
  return { job: data.job }
}

export const fetchSurveyCompareResult = async ({
  surveyId,
  resultFileName,
}: {
  surveyId: number
  resultFileName: string
}): Promise<any> => {
  const { data } = await axios.get(`/api/survey/${surveyId}/compare/result`, { params: { resultFileName } })
  return data
}

export const startSurveyCompareApplyJob = async ({
  surveyId,
  sourceFileName,
  selectedIds,
  manualMatches = {},
}: {
  surveyId: number
  sourceFileName: string
  selectedIds: string[]
  manualMatches?: Record<string, string>
}): Promise<{ job: any }> => {
  const { data } = await axios.post(`/api/survey/${surveyId}/compare/apply`, {
    sourceFileName,
    selectedIds: JSON.stringify(selectedIds),
    manualMatches: JSON.stringify(manualMatches),
  })
  return { job: data.job }
}
