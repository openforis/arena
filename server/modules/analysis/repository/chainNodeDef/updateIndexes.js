import { DB, Schemata } from '@openforis/arena-server'

export const updateIndexes = async (params, client = DB) => {
  const { surveyId } = params
  const schema = Schemata.getSchemaSurvey(surveyId)

  return client.none(`
    update ${schema}.chain_node_def cnd
    set index = r.row_number - 1 
    from (
        select cnd.uuid,
                row_number() over (
                    partition by cnd.chain_uuid, n.parent_uuid
                    order by cnd.index
                ) as row_number
         from ${schema}.chain_node_def cnd
         left join ${schema}.node_def n
         on n.uuid = cnd.node_def_uuid
    ) as r
    where cnd.uuid = r.uuid
    `)
}
