import * as Survey from '@core/survey/survey'
import * as Record from '@core/record/record'

/**
 * Returns the record with its survey uuid (needed by the Authorizer), taken from the survey when missing.
 * @param {object} record - The record.
 * @param {object} survey - The survey.
 * @returns {object} The record.
 */
export const withSurveyUuid = (record: any, survey: any) =>
  Record.getSurveyUuid(record)
    ? record
    : { ...record, [Record.keys.surveyUuid]: Survey.getUuid(Survey.getSurveyInfo(survey)) }
