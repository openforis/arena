import * as SchemaRdb from '@common/surveyRdb/schemaRdb'
import * as A from '@core/arena'
import { db, DbClient } from '@server/db/db'

export const fetchNodesHierarchyKeys = (
  { surveyId, nodeUuids }: { surveyId: number; nodeUuids: string[] },
  client: DbClient = db
) =>
  client.map(
    `
    SELECT *
    FROM 
      ${SchemaRdb.getName(surveyId)}._node_keys_hierarchy h
    WHERE 
      h.node_uuid IN ($1:csv)
    `,
    [nodeUuids],
    A.camelizePartial({ limitToLevel: 1 })
  )
