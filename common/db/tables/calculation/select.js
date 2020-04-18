import * as Schemata from '../../schemata'
import * as TableCalculation from './table'

/**
 * Generate the select query for the processing_step_calculation table by the given parameters.
 *
 * @param {!object} params - The query parameters.
 * @param {!string} params.surveyId - The survey id.
 * @param {string} [params.stepUuid=null] - The step uuid to filter.
 * @param {boolean} [params.includeScript=false] - Whether to include the R script.
 *
 * @returns {string} - The select query.
 */
export const getSelect = (params) => {
  const { surveyId, stepUuid = null, includeScript = false } = params

  return `SELECT ${includeScript ? TableCalculation.columns : TableCalculation.columnsNoScript}
    FROM ${Schemata.getSchemaNameSurvey(surveyId)}.${TableCalculation.name} AS ${TableCalculation.alias}
    ${stepUuid ? `WHERE ${TableCalculation.columnStepUuid} = ${stepUuid}` : ''}`
}
