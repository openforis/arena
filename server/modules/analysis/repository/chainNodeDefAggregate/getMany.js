import { Objects } from '@openforis/arena-core'
import { BaseProtocol, DB, Schemata } from '@openforis/arena-server'

/**
 * Fetches chainNodeDefsAggregate by the given survey id.
 *
 * @param {!object} params - The query parameters.
 * @param {!number} params.surveyId - The survey id.
 * @param {BaseProtocol} [client=db] - The database client.
 *
 * @returns {Promise<Array<ChainNodeDefAggregate>>} - The result promise.
 */
export const getAll = async (params, client = DB) => {
  const { surveyId } = params

  const schema = Schemata.getSchemaSurvey(surveyId)
  return client.map(
    `
    select *
    from ${schema}.chain_node_def_aggregate`,
    [],
    Objects.camelize
  )
}
