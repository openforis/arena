import { DB, Schemata } from '@openforis/arena-server'

export const insert = async (params, client = DB) => {
  const { chainNodeDef, surveyId } = params
  const { chainUuid, nodeDefUuid, uuid } = chainNodeDef
  const schema = Schemata.getSchemaSurvey(surveyId)

  return client.none(
    `insert into ${schema}.chain_node_def (uuid, chain_uuid, node_def_uuid, index)
    select $1, $2, $3, coalesce(max(cnd.index + 1), 0)
    from ${schema}.chain_node_def cnd
    where cnd.node_def_uuid in (
        select n.uuid
        from ${schema}.node_def n
        where n.parent_uuid = (
            select n.parent_uuid
            from ${schema}.node_def n
            where n.uuid = $3
        )
        and n.analysis = true
    )`,
    [uuid, chainUuid, nodeDefUuid]
  )
}
