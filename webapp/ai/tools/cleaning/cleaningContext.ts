import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Authorizer from '@core/auth/authorizer'

import type { AiToolContext } from '@webapp/ai/tools/types'

/**
 * Returns true when a survey is open and the user can cleanse its records (the cleaning area's permission).
 * @param {AiToolContext} ctx - Tool context.
 * @returns {boolean} Whether the cleaning tools can run.
 */
export const canCleanseCurrentSurvey = (ctx: AiToolContext): boolean =>
  !!ctx.survey && Authorizer.canCleanseRecords(ctx.user, Survey.getSurveyInfo(ctx.survey))

/**
 * Returns the values every cleaning tool needs.
 * @param {AiToolContext} ctx - Tool context.
 * @returns {object} Survey, its info and id, cycle and survey language.
 */
export const getCleaningContext = (ctx: AiToolContext) => {
  const { survey } = ctx
  const surveyInfo = Survey.getSurveyInfo(survey)
  return { survey, surveyInfo, surveyId: Survey.getId(survey), cycle: ctx.cycle, lang: ctx.lang }
}

/**
 * Finds the attribute definitions with the given names.
 * @param {object} params - Parameters.
 * @param {object} params.survey - The survey.
 * @param {string[]} params.names - Attribute names.
 * @returns {{nodeDefs: object[], unknownNames: string[]}} The definitions found and the unknown names.
 */
export const resolveAttributeDefs = ({ survey, names }: { survey: any; names: string[] }) => {
  const nodeDefs: any[] = []
  const unknownNames: string[] = []
  for (const name of names) {
    // getNodeDefByName throws for an unknown name
    const nodeDef = Survey.getNodeDefsArray(survey).find((def: any) => NodeDef.getName(def) === name)
    if (nodeDef && NodeDef.isAttribute(nodeDef)) nodeDefs.push(nodeDef)
    else unknownNames.push(name)
  }
  return { nodeDefs, unknownNames }
}
