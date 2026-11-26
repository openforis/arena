import { withClosestNames } from '@common/ai/closestNames'
import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'
import { findNodeDefByName, getCurrentNodeDefs } from '@webapp/ai/tools/common/nodeDefLookup'
import type { AiToolContext } from '@webapp/ai/tools/types'

/**
 * Returns the values every cleaning tool needs.
 * @returns {object} Survey, its info and id, cycle and survey language.
 */
export const getCleaningContext = (ctx: AiToolContext) => {
  const { survey } = ctx
  const surveyInfo = Survey.getSurveyInfo(survey)
  return { survey, surveyInfo, surveyId: Survey.getId(survey), cycle: ctx.cycle, lang: ctx.lang }
}

/**
 * Finds the (current, not analysis) attribute definitions with the given names.
 * @param {object} params - Parameters.
 * @param {string[]} params.names - Attribute names.
 * @returns {{nodeDefs: object[], unknownNames: string[]}} The definitions found and the unknown names.
 */
export const resolveAttributeDefs = ({ survey, names }: { survey: any; names: string[] }) => {
  const nodeDefs: any[] = []
  const unknownNames: string[] = []
  for (const name of names) {
    const nodeDef = findNodeDefByName(survey, name)
    if (nodeDef && NodeDef.isAttribute(nodeDef)) nodeDefs.push(nodeDef)
    else unknownNames.push(name)
  }
  return { nodeDefs, unknownNames }
}

/**
 * Describes the unknown attribute names with the real names close to each, for a tool error.
 * @param {object} params - Parameters.
 * @param {string[]} params.names - The unknown names.
 * @returns {string} E.g. `tree_number (close names: tree_no)`.
 */
export const describeUnknownAttributes = ({ survey, names }: { survey: any; names: string[] }): string => {
  const attributeNames = getCurrentNodeDefs(survey).filter(NodeDef.isAttribute).map(NodeDef.getName)
  return names.map((name) => withClosestNames(name, attributeNames)).join(', ')
}
