import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Record from '@core/record/record'
import * as Authorizer from '@core/auth/authorizer'
import { isNodeDefValueEditable } from '@core/record/nodeValueParser'

export type EditRefusal = { code: string; message: string }

/**
 * Checks that the user may edit the record: published survey, step and ownership (group qualifiers are checked by
 * GET /record, which refuses records outside them).
 * @param {object} params - Parameters.
 * @param {object} params.user - The user.
 * @param {object} params.survey - The survey.
 * @param {object} params.record - The record.
 * @returns {EditRefusal|null} Why it can't be edited, or null.
 */
export const checkRecordEditable = ({
  user,
  survey,
  record,
}: {
  user: any
  survey: any
  record: any
}): EditRefusal | null => {
  const surveyInfo = Survey.getSurveyInfo(survey)
  if (!Survey.isPublished(surveyInfo)) {
    return { code: 'surveyNotPublished', message: 'Records can be edited only when the survey is published.' }
  }
  // GET /record returns no survey uuid: the authorizer needs it to find the user's group
  const recordWithSurvey = { ...record, [Record.keys.surveyUuid]: Survey.getUuid(surveyInfo) }
  if (!Authorizer.canEditRecord(user, recordWithSurvey)) {
    return {
      code: 'recordNotEditable',
      message: 'You may not edit this record (its step, or it belongs to another user). Tell the user.',
    }
  }
  return null
}

/**
 * Checks that the value of the attribute may be set by hand by the user.
 * @param {object} params - Parameters.
 * @param {object} params.user - The user.
 * @param {object} params.survey - The survey.
 * @param {object} params.nodeDef - The node definition.
 * @returns {EditRefusal|null} Why it can't be edited, or null.
 */
export const checkAttributeEditable = ({
  user,
  survey,
  nodeDef,
}: {
  user: any
  survey: any
  nodeDef: any
}): EditRefusal | null => {
  if (!isNodeDefValueEditable(nodeDef)) {
    return {
      code: 'attributeNotEditable',
      message: `\`${NodeDef.getName(nodeDef)}\` is not an attribute you can set (entity, read-only or calculated).`,
    }
  }
  if (NodeDef.isQualifier(nodeDef) && !Authorizer.canEditQualifierAttributeValue(user, Survey.getSurveyInfo(survey))) {
    return {
      code: 'qualifierNotEditable',
      message: `\`${NodeDef.getName(nodeDef)}\` is a user group qualifier: only survey administrators may change it.`,
    }
  }
  return null
}
