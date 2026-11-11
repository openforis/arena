import axios from 'axios'

import { objectToFormData } from '../utils/apiUtils'

/**
 * Source of a comparison: a survey file uploaded before (kept on the server) or another survey on this server.
 */
export interface SurveyCompareSourceRef {
  sourceFileId?: string
  sourceSurveyId?: number
}

/**
 * Starts the comparison of the survey with an uploaded survey file or with a source compared before.
 * @param {object} params - Parameters.
 * @param {number} params.surveyId - Id of the survey to compare.
 * @param {File} [params.file] - Arena survey export file (zip).
 * @param {SurveyCompareSourceRef} [params.sourceRef] - Source compared before or another survey on this server.
 * @param {Record<string, string>} [params.manualMatches] - Node defs matched by the user (target uuid by source uuid).
 * @returns {Promise<object>} - The started job.
 */
export const startSurveyCompareJob = async ({
  surveyId,
  file = undefined,
  sourceRef = undefined,
  manualMatches = {},
}: {
  surveyId: number
  file?: File
  sourceRef?: SurveyCompareSourceRef
  manualMatches?: Record<string, string>
}): Promise<{ job: any }> => {
  const formData = file ? objectToFormData({ file }) : { ...sourceRef, manualMatches: JSON.stringify(manualMatches) }
  const { data } = await axios.post(`/api/survey/${surveyId}/compare`, formData)
  return { job: data.job }
}

export const fetchSurveyCompareResult = async ({
  surveyId,
  resultFileId,
}: {
  surveyId: number
  resultFileId: string
}): Promise<any> => {
  const { data } = await axios.get(`/api/survey/${surveyId}/compare/result`, { params: { resultFileId } })
  return data
}

export const startSurveyCompareApplyJob = async ({
  surveyId,
  sourceRef,
  selectedIds,
  manualMatches = {},
}: {
  surveyId: number
  sourceRef: SurveyCompareSourceRef
  selectedIds: string[]
  manualMatches?: Record<string, string>
}): Promise<{ job: any }> => {
  const { data } = await axios.post(`/api/survey/${surveyId}/compare/apply`, {
    ...sourceRef,
    selectedIds: JSON.stringify(selectedIds),
    manualMatches: JSON.stringify(manualMatches),
  })
  return { job: data.job }
}

/**
 * Fetches the fingerprints (SHA-256, strict and structural) of a survey definition.
 * @param {object} params - Parameters.
 * @param {number} params.surveyId - The survey id.
 * @param {boolean} [params.draft] - Whether to use the draft (default) or the published version of the survey.
 * @returns {Promise<{strict: string, structural: string}>} - The fingerprints.
 */
export const fetchSurveyFingerprint = async ({
  surveyId,
  draft = true,
}: {
  surveyId: number
  draft?: boolean
}): Promise<{ strict: string; structural: string }> => {
  const { data } = await axios.get(`/api/survey/${surveyId}/fingerprint`, { params: { draft } })
  return data
}
