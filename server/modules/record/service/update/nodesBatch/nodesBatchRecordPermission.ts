import type { ArenaRecord, ArenaSurvey } from '@openforis/arena-core'

import * as Record from '@core/record/record'
import * as Survey from '@core/survey/survey'

/**
 * Returns the record with its survey uuid (needed by the Authorizer), taken from the survey when missing.
 * @returns {object} The record.
 */
export const withSurveyUuid = (record: ArenaRecord, survey: ArenaSurvey) =>
  Record.getSurveyUuid(record)
    ? record
    : { ...record, [Record.keys.surveyUuid]: Survey.getUuid(Survey.getSurveyInfo(survey)) }
