import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Record from '@core/record/record'
import * as Node from '@core/record/node'
import { Schemata, TableDataNodeDef } from '@common/model/db'
import { TableDataNodeDefColUtils } from '@common/model/db/tables/dataNodeDef/colUtils'
import * as NodeDefTable from '@common/surveyRdb/nodeDefTable'

import { RdbUpdateTypes, RdbUpdates } from './RdbUpdates'

const types = RdbUpdateTypes

// ==== parsing

const _hasTable = (nodeDef) => NodeDef.isMultiple(nodeDef) || NodeDef.isRoot(nodeDef)

const _getType = (nodeDef, node) => {
  const created = Node.isCreated(node)
  const deleted = Node.isDeleted(node)
  const updated = Node.isUpdated(node)
  const withTable = _hasTable(nodeDef)

  if (withTable) {
    if (created) {
      return types.insert
    }
    if (deleted) {
      return types.delete
    }
    if (updated && NodeDef.isMultipleAttribute(nodeDef)) {
      return types.update
    }
  } else if (!deleted) {
    return types.update
  }
  return null
}

const _getValuesByColumnNameDefault = ({ survey, nodeDef, node }) =>
  TableDataNodeDefColUtils.getValuesByColumnName({ survey, nodeDefCol: nodeDef, nodeCol: node })

const _getValuesByColumnName = ({ survey, record, nodeDef, node, ancestorMultipleEntity, type }) => {
  if (type !== types.insert) {
    return _getValuesByColumnNameDefault({ survey, nodeDef, node })
  } else {
    const { columnSet } = TableDataNodeDef
    const result = {
      [columnSet.recordUuid]: Node.getRecordUuid(node),
      [columnSet.iId]: Node.getIId(node),
      [columnSet.parentInternalId]: Node.getIId(ancestorMultipleEntity),
      [columnSet.dateCreated]: Node.getDateCreated(node),
      [columnSet.dateModified]: Node.getDateModified(node),
    }
    if (NodeDef.isRoot(nodeDef)) {
      Object.assign(result, {
        [columnSet.recordCycle]: Record.getCycle(record),
        [columnSet.recordStep]: Record.getStep(record),
        [columnSet.recordOwnerUuid]: Record.getOwnerUuid(record),
      })
    }
    if (NodeDef.isMultipleAttribute(nodeDef)) {
      Object.assign(result, _getValuesByColumnNameDefault({ survey, nodeDef, node }))
    }
    return result
  }
}

const _findAncestor = ({ ancestorDefUuid, node, nodes }) => {
  let currentParent = nodes[Node.getParentInternalId(node)]
  while (currentParent && !Node.isRoot(currentParent) && Node.getNodeDefUuid(currentParent) !== ancestorDefUuid) {
    currentParent = nodes[Node.getParentInternalId(currentParent)]
  }
  return currentParent
}

const _getUpdateKey = ({ nodeDef, ancestorMultipleEntity, node }) =>
  _hasTable(nodeDef) ? Node.getIId(node) : Node.getIId(ancestorMultipleEntity)

export const generateRdbUpdates = ({ survey, record, nodes }) => {
  // visit nodes with BFS algorithm to avoid FK constraints violations (sort nodes by hierarchy depth)
  const nodesArray = Object.values(nodes).sort(
    (nodeA, nodeB) => Node.getHierarchy(nodeA).length - Node.getHierarchy(nodeB).length
  )
  const updatesAcc = new RdbUpdates()
  for (const node of nodesArray) {
    const nodeDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(node))(survey)
    // skip single entities
    if (!NodeDef.isRoot(nodeDef) && NodeDef.isSingleEntity(nodeDef)) {
      continue
    }
    const type = _getType(nodeDef, node)
    if (!type) {
      continue
    }
    const ancestorDef = Survey.getNodeDefAncestorMultipleEntity(nodeDef)(survey)
    const ancestorDefUuid = NodeDef.getUuid(ancestorDef)
    const ancestorMultipleEntity = _findAncestor({ ancestorDefUuid, node, nodes })
    const update = {
      type,
      schema: Schemata.getSchemaSurveyRdb(Survey.getId(survey)),
      table: NodeDefTable.getTableName(nodeDef, ancestorDef),
      recordUuid: Record.getUuid(record),
      nodeIId: _getUpdateKey({ nodeDef, ancestorMultipleEntity, node }),
      nodeDefUuid: NodeDef.getUuid(nodeDef),
      nodeDefHierarchyLevel: NodeDef.getMetaHierarchy(nodeDef).length,
      valuesByColumnName: _getValuesByColumnName({ survey, record, nodeDef, node, ancestorMultipleEntity, type }),
    }
    updatesAcc.addUpdate(update)
  }
}

// ==== execution

const _update = (update, client) => {
  const { schema, table, valuesByColumnName, recordUuid, nodeIId } = update
  const columnNames = Object.keys(valuesByColumnName)
  const values = Object.values(valuesByColumnName)
  return client.one(
    `UPDATE ${schema}.${table}
      SET ${columnNames.map((col, i) => `${col} = $${i + 3}`).join(',')}
      WHERE record_uuid = $1 AND i_id = $2
      RETURNING record_uuid, i_id`,
    [recordUuid, nodeIId, ...values]
  )
}

const _insert = (update, client) => {
  const { schema, table, valuesByColumnName } = update
  const columnNames = Object.keys(valuesByColumnName)
  const values = Object.values(valuesByColumnName)
  return client.one(
    `INSERT INTO ${schema}.${table}
      (${columnNames.join(',')})
      VALUES 
      (${columnNames.map((_col, i) => `$${i + 1}`).join(',')})
      RETURNING record_uuid, i_id`,
    values
  )
}

const _delete = (update, client) => {
  const { schema, table, recordUuid, nodeIId } = update
  return client.oneOrNone(
    `DELETE FROM ${schema}.${table} 
    WHERE record_uuid = $1 AND i_id = $2
    RETURNING record_uuid, i_id`,
    [recordUuid, nodeIId]
  )
}

const queryByType = {
  [types.delete]: _delete,
  [types.insert]: _insert,
  [types.update]: _update,
}

export const updateTablesFromUpdates = async ({ rdbUpdates }, client) => {
  const updatesToRunInBatch = rdbUpdates.getAll().map((update) => queryByType[update.type](update, client))

  if (updatesToRunInBatch.length > 0) {
    await client.batch(updatesToRunInBatch)
  }
}

export const updateTables = async ({ survey, record, nodes }, client) => {
  const rdbUpdates = generateRdbUpdates({ survey, record, nodes })
  await updateTablesFromUpdates({ rdbUpdates }, client)
}

export const updateRecordStep = async ({ surveyId, recordUuid, stepId, tableDef }, client) => {
  const tableName = NodeDefTable.getTableName(tableDef)

  return client.one(
    `UPDATE ${Schemata.getSchemaSurveyRdb(surveyId)}.${tableName}
    SET ${TableDataNodeDef.columnSet.recordStep} = $/stepId/
    WHERE ${TableDataNodeDef.columnSet.recordUuid} = $/recordUuid/
    RETURNING uuid`,
    { recordUuid, stepId }
  )
}
