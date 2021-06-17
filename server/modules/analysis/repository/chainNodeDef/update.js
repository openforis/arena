import { Objects } from '@openforis/arena-core'
import { DB, Schemata } from '@openforis/arena-server'

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
