import { BaseProtocol, DB, Schemata } from '@openforis/arena-server'

/**
 * Counts the number of chainNodeDefs by the given survey id and chainNodeDefUuid grouped by entityDefUuid.
 *
 * @param {!object} params - The query parameters.
 * @param {!number} params.surveyId - The survey id.
 * @param {!string} params.chainUuid - The chainNodeDef uuid.
 * @param {BaseProtocol} [client=db] - The database client.
 *
 * @returns {Promise<Record<string, number>>} - The result promise.
 */
export const count = async (params, client = DB) => {
  const { surveyId, chainUuid } = params
  const schema = Schemata.getSchemaSurvey(surveyId)

  return client.one(
    `
    with c as (
        select n.parent_uuid, count(cnd.uuid)
        from ${schema}.chain_node_def cnd
        right join ${schema}.node_def n
        on cnd.node_def_uuid = n.uuid
        and n.deleted = false
        where cnd.chain_uuid = $1
        group by cnd.chain_uuid, n.parent_uuid
    )
    select coalesce(jsonb_object_agg(c.parent_uuid, c.count), '{}'::jsonb) as count
    from c`,
    [chainUuid],
    (res) => res.count
  )
}
