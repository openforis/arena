import { Objects } from '@openforis/arena-core'
import { BaseProtocol, DB, Schemata } from '@openforis/arena-server'

/**
 * Fetches chainNodeDefs by the given survey id, chain uuid and parent entity definition.
 *
 * @param {!object} params - The query parameters.
 * @param {!number} params.surveyId - The survey id.
 * @param {!string} params.chainUuid - The chain uuid.
 * @param {!string} params.entityDefUuid - The entity .
 * @param {BaseProtocol} [client=db] - The database client.
 *
 * @returns {Promise<Array<ChainNodeDef>>} - The result promise.
 */
export const getMany = async (params, client = DB) => {
  const { surveyId, chainUuid, entityDefUuid } = params

  const schema = Schemata.getSchemaSurvey(surveyId)
  return client.map(
    `
    select cnd.uuid, cnd.chain_uuid, cnd.node_def_uuid, cnd.index, cnd.props
    from ${schema}.chain_node_def cnd
    where cnd.chain_uuid = $1
    and cnd.node_def_uuid in
        (select n.uuid from ${schema}.node_def n where n.parent_uuid = $2)
    order by cnd.index`,
    [chainUuid, entityDefUuid],
    Objects.camelize
  )
}
