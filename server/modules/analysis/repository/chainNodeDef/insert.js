import { DB, Schemata } from '@openforis/arena-server'

export const insert = async (params, client = DB) => {
  const { chainNodeDef, surveyId } = params
  const { chainUuid, nodeDefUuid, props, uuid } = chainNodeDef
  const schema = Schemata.getSchemaSurvey(surveyId)

  return client.none(
    `
    insert into ${schema}.chain_node_def (uuid, chain_uuid, node_def_uuid, props, index)
    select $1, $2, $3, $4::jsonb, coalesce(max(cnd.index + 1), 0)
    from ${schema}.chain_node_def cnd
    where cnd.node_def_uuid in (
        select n.uuid
        from ${schema}.node_def n
        where cnd.chain_uuid = $2
        and n.parent_uuid = (
            select n.parent_uuid
            from ${schema}.node_def n
            where n.uuid = $3
        )
        and n.analysis = true
    )`,
    [uuid, chainUuid, nodeDefUuid, props]
  )
}
