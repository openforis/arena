import * as A from '@core/arena'

import * as SchemaRdb from '@common/surveyRdb/schemaRdb'

import { db } from '@server/db/db'

export const fetchNodesHierarchyKeys = async ({ surveyId, nodeUuids }, client = db) =>
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
