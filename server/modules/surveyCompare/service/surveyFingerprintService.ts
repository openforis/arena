import { createHash } from 'node:crypto'

import {
  CategoryItemsByCategoryUuid,
  SurveyFingerprintType,
  TaxaByTaxonomyUuid,
  buildSurveyFingerprintContent,
} from '@core/survey/surveyCompare'

import { db } from '@server/db/db'

import { fetchSurveyFromDb } from './surveyCompareSurveysReader'

export interface SurveyFingerprint {
  strict: string
  structural: string
}

const sha256 = (content: string): string => createHash('sha256').update(content).digest('hex')

/**
 * Computes the fingerprints (SHA-256 hashes, strict and structural) of a survey definition.
 * @param {object} params - The parameters.
 * @param {any} params.survey - The survey.
 * @param {CategoryItemsByCategoryUuid} params.itemsByCategoryUuid - Category items by category uuid.
 * @param {TaxaByTaxonomyUuid} params.taxaByTaxonomyUuid - Taxa by taxonomy uuid.
 * @returns {SurveyFingerprint} - The fingerprints.
 */
export const computeSurveyFingerprint = ({
  survey,
  itemsByCategoryUuid,
  taxaByTaxonomyUuid,
}: {
  survey: any
  itemsByCategoryUuid: CategoryItemsByCategoryUuid
  taxaByTaxonomyUuid: TaxaByTaxonomyUuid
}): SurveyFingerprint => {
  const fingerprint = (type: SurveyFingerprintType) =>
    sha256(buildSurveyFingerprintContent({ survey, itemsByCategoryUuid, taxaByTaxonomyUuid, type }))
  return {
    strict: fingerprint(SurveyFingerprintType.strict),
    structural: fingerprint(SurveyFingerprintType.structural),
  }
}

/**
 * Fetches a survey and computes the fingerprints of its definition.
 * @param {object} params - The parameters.
 * @param {number} params.surveyId - The survey id.
 * @param {boolean} [params.draft] - Whether to use the draft (default) or the published version of the survey.
 * @param {any} [client] - Database client.
 * @returns {Promise<SurveyFingerprint>} - The fingerprints.
 */
export const fetchSurveyFingerprint = async (
  { surveyId, draft = true }: { surveyId: number; draft?: boolean },
  client: any = db
): Promise<SurveyFingerprint> => {
  const { survey, itemsByCategoryUuid, taxaByTaxonomyUuid } = await fetchSurveyFromDb({ surveyId, draft }, client)
  return computeSurveyFingerprint({ survey, itemsByCategoryUuid, taxaByTaxonomyUuid })
}
