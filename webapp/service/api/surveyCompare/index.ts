import axios from 'axios'

import { objectToFormData } from '../utils/apiUtils'

/**
 * Starts the comparison of the survey with an uploaded survey file (or with the one uploaded before).
 * @param {object} params - Parameters.
 * @param {number} params.surveyId - Id of the survey to compare.
 * @param {File} [params.file] - Arena survey export file (zip).
 * @param {string} [params.sourceFileName] - Temp file name of a survey file uploaded before.
 * @returns {Promise<object>} - The started job.
 */
export const startSurveyCompareJob = async ({
  surveyId,
  file = undefined,
  sourceFileName = undefined,
}: {
  surveyId: number
  file?: File
  sourceFileName?: string
}): Promise<{ job: any }> => {
  const formData = file ? objectToFormData({ file }) : { sourceFileName }
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
}: {
  surveyId: number
  sourceFileName: string
  selectedIds: string[]
}): Promise<{ job: any }> => {
  const { data } = await axios.post(`/api/survey/${surveyId}/compare/apply`, {
    sourceFileName,
    selectedIds: JSON.stringify(selectedIds),
  })
  return { job: data.job }
}
