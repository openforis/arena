import { DB, Schemata } from '@openforis/arena-server'

export const insertMany = async ({ surveyId, chainNodeDefsAggregate = [] }, client = DB) =>
  client.tx(async (tx) => {
    if (chainNodeDefsAggregate?.length <= 0) return false
    const schema = Schemata.getSchemaSurvey(surveyId)
    return tx.batch([
      chainNodeDefsAggregate.map(({ uuid, chainUuid, nodeDefUuid, props, formula }) =>
        tx.none(
          `
    insert into ${schema}.chain_node_def_aggregate (uuid, chain_uuid, node_def_uuid, props, formula )
    VALUES ($1, $2, $3, $4::jsonb, $5)`,
          [uuid, chainUuid, nodeDefUuid, props, formula]
        )
      ),
    ])
  })
