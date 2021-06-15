import { Objects } from '@openforis/arena-core'
import { DB, Schemata } from '@openforis/arena-server'

export const update = async (params, client = DB) => {
  const { chainNodeDef, surveyId, newIndex } = params
  const { chainUuid, index, nodeDefUuid, props, uuid } = chainNodeDef
  const schema = Schemata.getSchemaSurvey(surveyId)

  const queries = []
  if (newIndex !== null) {
    queries.push(
      client.none(
        `
    update ${schema}.chain_node_def cnd
    set index = case
                    when cnd.index > $1 and cnd.index <= $2 then cnd.index - 1
                    when cnd.index < $1 and cnd.index >= $2 then cnd.index + 1
                    when cnd.index = $1 then $2
                    else cnd.index
                end
    where cnd.chain_uuid = $3
    and cnd.node_def_uuid in
        (
            select nd.uuid
            from ${schema}.node_def nd
            where nd.parent_uuid =
                (select nd.parent_uuid from ${schema}.node_def nd where nd.uuid = $4)
            and nd.analysis
          );
        `,
        [index, newIndex, chainUuid, nodeDefUuid]
      )
    )
  }

  queries.push(
    client.one(
      `
    update ${schema}.chain_node_def
    set props = $2
    where uuid = $1 
    returning uuid, chain_uuid, node_def_uuid, index, props`,
      [uuid, props],
      Objects.camelize
    )
  )

  return client.tx((t) => t.batch(queries))
}

export const updateScript = async ({ uuid, surveyId, newSript }, client = DB) => {
  const schema = Schemata.getSchemaSurvey(surveyId)

  const queries = []

  queries.push(
    client.one(
      `
    update ${schema}.chain_node_def
    set script = $2
    where uuid = $1 
    returning uuid, chain_uuid, node_def_uuid, index, props`,
      [uuid, newSript],
      Objects.camelize
    )
  )

  return client.tx((t) => t.batch(queries))
}
