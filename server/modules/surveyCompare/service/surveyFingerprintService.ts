import { createHash } from 'node:crypto'

import { SurveyFingerprintType, buildSurveyFingerprintContent } from '@core/survey/surveyCompare'

import { db } from '@server/db/db'

import { fetchSurveyFromDb } from './surveyCompareSurveysReader'

const sha256 = (content: string): string => createHash('sha256').update(content).digest('hex')

/**
 * Computes the fingerprints (SHA-256 hashes, strict and structural) of a survey definition.
 * @param {object} params - The parameters.
 * @param {number} params.surveyId - The survey id.
 * @param {boolean} [params.draft] - Whether to use the draft (default) or the published version of the survey.
 * @param {any} [client] - Database client.
 * @returns {Promise<{strict: string, structural: string}>} - The fingerprints.
 */
export const fetchSurveyFingerprint = async (
  { surveyId, draft = true }: { surveyId: number; draft?: boolean },
  client: any = db
): Promise<{ strict: string; structural: string }> => {
  const { survey, itemsByCategoryUuid, taxaByTaxonomyUuid } = await fetchSurveyFromDb({ surveyId, draft }, client)
  const fingerprint = (type: SurveyFingerprintType) =>
    sha256(buildSurveyFingerprintContent({ survey, itemsByCategoryUuid, taxaByTaxonomyUuid, type }))
  return {
    strict: fingerprint(SurveyFingerprintType.strict),
    structural: fingerprint(SurveyFingerprintType.structural),
  }
}
