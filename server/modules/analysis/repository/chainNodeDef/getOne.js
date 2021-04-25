import { Objects } from '@openforis/arena-core'
import { BaseProtocol, DB, Schemata } from '@openforis/arena-server'

/**
 * Fetches a chainNodeDef by the given survey id, and chainNodeDefUuid.
 *
 * @param {!object} params - The query parameters.
 * @param {!number} params.surveyId - The survey id.
 * @param {!string} params.chainNodeDefUuid - The chainNodeDef uuid.
 * @param {BaseProtocol} [client=db] - The database client.
 *
 * @returns {Promise<Array<ChainNodeDef>>} - The result promise.
 */
export const getOne = async (params, client = DB) => {
  const { surveyId, chainNodeDefUuid } = params
  const schema = Schemata.getSchemaSurvey(surveyId)

  return client.one(
    `select cnd.uuid, cnd.chain_uuid, cnd.node_def_uuid, cnd.index, cnd.props
    from ${schema}.chain_node_def cnd
    where cnd.uuid = $1`,
    [chainNodeDefUuid],
    Objects.camelize
  )
}
