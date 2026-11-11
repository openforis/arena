import type { LanguageCode } from '@openforis/arena-core'

import type { RecordEvaluationContext } from '@core/record/recordEvaluationContext'

import { CategoryItemProviderDefault } from '@server/modules/category/manager/categoryItemProviderDefault'
import { TaxonProviderDefault } from '@server/modules/taxonomy/manager/taxonProviderDefault'
import { AreaOfInterestProviderDefault } from '@server/modules/survey/manager/areaOfInterestProviderDefault'

/**
 * Providers used by the expression evaluator on the server.
 */
export const RecordProvidersDefault = {
  categoryItemProvider: CategoryItemProviderDefault,
  taxonProvider: TaxonProviderDefault,
  areaOfInterestProvider: AreaOfInterestProviderDefault,
}

type CreateParams = {
  user: any
  survey: any
  timezoneOffset?: number | null
  lang?: string | null
}

/**
 * Creates the params needed to evaluate the survey expressions while updating or validating a record on the server:
 * spread them in the params of the record update and validation functions.
 * @param {!object} params - The parameters.
 * @param {!object} params.user - The user performing the update.
 * @param {!object} params.survey - The survey.
 * @param {number} [params.timezoneOffset] - The timezone offset of the client (in minutes).
 * @param {string} [params.lang] - The language used by language-dependent expression functions.
 * @returns {RecordEvaluationContext} - The context.
 */
export const createRecordEvaluationContext = ({
  user,
  survey,
  timezoneOffset,
  lang,
}: CreateParams): RecordEvaluationContext => ({
  user,
  survey,
  ...RecordProvidersDefault,
  ...(timezoneOffset === null || timezoneOffset === undefined ? {} : { timezoneOffset }),
  ...(lang ? { lang: lang as LanguageCode } : {}),
})
