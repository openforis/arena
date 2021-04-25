import { DB, Schemata } from '@openforis/arena-server'
import { camelize } from '@core/arena'

export const update = async (params, client = DB) => {
  const { chainNodeDef, surveyId } = params
  const { index, props, uuid } = chainNodeDef
  const schema = Schemata.getSchemaSurvey(surveyId)

  return client.one(
    `update ${schema}.chain_node_def 
    set props = $2, index = $3
    where uuid = $1
    returning uuid, chain_uuid, node_def_uuid, index, props`,
    [uuid, props, index],
    camelize
  )
}
