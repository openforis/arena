import * as SQL from '../../sql'
import * as Schemata from '../../schemata/survey'
import * as TableCalculation from '../calculation'
import * as TableStep from './table'

const _getJoinCalculation = ({ surveyId, includeScript }) =>
  `LEFT JOIN LATERAL (
    ${TableCalculation.getSelect({ surveyId, includeScript, stepUuid: TableStep.columnUuid })}
  ) AS ${TableCalculation.alias}
  ON TRUE`

/**
 * Generate the select query for the processing_step table by the given parameters.
 *
 * @param {!object} params - The query parameters.
 * @param {!string} params.surveyId - The survey id.
 * @param {string} [params.chainUuid=null] - The chain uuid to filter.
 * @param {boolean} [params.includeCalculations=false] - Whether to include calculations.
 * @param {boolean} [params.includeScript=false] - Whether to include calculations script.
 *
 * @returns {string} - The select query.
 */
export const getSelect = (params) => {
  const { surveyId, chainUuid = null, includeCalculations = false, includeScript = false } = params

  const selectFields = [...TableStep.columns]
  if (includeCalculations) {
    const jsonAgg = SQL.jsonAgg(SQL.addAlias(TableCalculation.alias, '*'), [TableCalculation.columnIndex])
    selectFields.push(`${jsonAgg} AS calculations`)
  }

  return `SELECT
        ${selectFields.join(', ')}
    FROM 
        ${Schemata.getSchemaNameSurvey(surveyId)}.${TableStep.name} AS ${TableStep.alias}
        ${includeCalculations ? _getJoinCalculation({ surveyId, includeScript }) : ''}
        ${chainUuid ? `WHERE ${TableStep.columnChainUuid} = ${chainUuid}` : ''}
        ${includeCalculations ? `GROUP BY ${TableStep.columns.join(', ')}` : ''}`
}
