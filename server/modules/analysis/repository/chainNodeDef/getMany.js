import { Objects } from '@openforis/arena-core'
import { BaseProtocol, DB, Schemata } from '@openforis/arena-server'

/**
 * Fetches chainNodeDefs by the given survey id.
 *
 * @param {!object} params - The query parameters.
 * @param {!number} params.surveyId - The survey id.
 * @param {BaseProtocol} [client=db] - The database client.
 *
 * @returns {Promise<Array<ChainNodeDef>>} - The result promise.
 */
export const getAll = async (params, client = DB) => {
  const { surveyId } = params

  const schema = Schemata.getSchemaSurvey(surveyId)
  return client.map(
    `
    select *
    from ${schema}.chain_node_def cnd
    order by cnd.index`,
    [],
    Objects.camelize
  )
}
