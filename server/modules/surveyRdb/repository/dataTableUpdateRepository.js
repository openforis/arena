import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Record from '@core/record/record'
import * as Node from '@core/record/node'
import * as SchemaRdb from '@common/surveyRdb/schemaRdb'

import * as DataTable from '../schemaRdb/dataTable'
import * as DataCol from '../schemaRdb/dataCol'

const types = { insert: 'insert', update: 'update', delete: 'delete' }

// ==== parsing

const _hasTable = NodeDef.isEntityOrMultiple

const _getType = (nodeDef, node) => {
  const created = Node.isCreated(node)
  const updated = Node.isUpdated(node)
  const deleted = Node.isDeleted(node)

  if (created && _hasTable(nodeDef)) {
    return types.insert
  }
  if (deleted && _hasTable(nodeDef)) {
    return types.delete
  }
  if (updated || created) {
    return types.update
  }
  return null
}

const _getColumnNames = ({ nodeDef, type }) =>
  type === types.insert
    ? [
        DataTable.columnNameUuuid,
        ...(NodeDef.isRoot(nodeDef)
          ? [DataTable.columnNameRecordUuid, DataTable.columnNameRecordCycle, DataTable.columnNameRecordStep]
          : []),
        DataTable.columnNameParentUuuid,
        ...(NodeDef.isMultipleAttribute(nodeDef) // Entity
          ? DataCol.getNames(nodeDef)
          : []),
      ]
    : DataCol.getNames(nodeDef)

const _getColValues = ({ survey, record, nodeDef, node, ancestorMultipleEntity, type }) =>
  type === types.insert
    ? [
        Node.getUuid(node),
        ...(NodeDef.isRoot(nodeDef) ? [Node.getRecordUuid(node), Record.getCycle(record), Record.getStep(record)] : []),
        Node.getUuid(ancestorMultipleEntity),
        ...(NodeDef.isMultipleAttribute(nodeDef) // Entity
          ? DataCol.getValues(survey, nodeDef, node)
          : []),
      ]
    : DataCol.getValues(survey, nodeDef, node)

const _findAncestor = ({ ancestorDefUuid, node, nodes }) => {
  let currentParent = nodes[Node.getParentUuid(node)]
  while (currentParent && !Node.isRoot(currentParent) && Node.getNodeDefUuid(currentParent) !== ancestorDefUuid) {
    currentParent = nodes[Node.getParentUuid(currentParent)]
  }
  return currentParent
}

const _getRowUuid = ({ nodeDef, ancestorMultipleEntity, node }) =>
  _hasTable(nodeDef) ? Node.getUuid(node) : Node.getUuid(ancestorMultipleEntity)

const _toUpdates = ({ survey, record, nodeDefs, nodes }) => {
  // visit nodes with BFS algorithm to avoid FK constraints violations (sort nodes by hierarchy depth)
  const nodesArray = Object.values(nodes).sort(
    (nodeA, nodeB) => Node.getHierarchy(nodeA).length - Node.getHierarchy(nodeB).length
  )
  return nodesArray.reduce((updatesAcc, node) => {
    const nodeDef = nodeDefs[Node.getNodeDefUuid(node)]
    // skip single entities
    if (!NodeDef.isRoot(nodeDef) && NodeDef.isSingleEntity(nodeDef)) {
      return updatesAcc
    }
    const ancestorDef = Survey.getNodeDefAncestorMultipleEntity(nodeDef)(survey)
    const ancestorDefUuid = NodeDef.getUuid(ancestorDef)
    const ancestorMultipleEntity = _findAncestor({ ancestorDefUuid, node, nodes })

    const type = _getType(nodeDef, node)
    if (type) {
      updatesAcc.push({
        type,
        schemaName: SchemaRdb.getName(Survey.getId(survey)),
        tableName: DataTable.getName(nodeDef, ancestorDef),
        columnNames: _getColumnNames({ nodeDef, type }),
        colValues: _getColValues({ survey, record, nodeDef, node, ancestorMultipleEntity, type }),
        rowUuid: _getRowUuid({ nodeDef, ancestorMultipleEntity, node }),
      })
    }
    return updatesAcc
  }, [])
}

// ==== execution

const _update = (update, client) =>
  client.one(
    `UPDATE ${update.schemaName}.${update.tableName}
      SET ${update.columnNames.map((col, i) => `${col} = $${i + 2}`).join(',')}
      WHERE uuid = $1
      RETURNING uuid`,
    [update.rowUuid, ...update.colValues]
  )

const _insert = (update, client) =>
  client.one(
    `INSERT INTO ${update.schemaName}.${update.tableName}
      (${update.columnNames.join(',')})
      VALUES 
      (${update.columnNames.map((_col, i) => `$${i + 1}`).join(',')})
      RETURNING uuid`,
    update.colValues
  )

const _delete = (update, client) =>
  client.one(
    `DELETE FROM ${update.schemaName}.${update.tableName} 
    WHERE uuid = $1
    RETURNING uuid`,
    update.rowUuid
  )

const queryByType = {
  [types.delete]: _delete,
  [types.insert]: _insert,
  [types.update]: _update,
}

export const updateTables = async ({ survey, record, nodeDefs, nodes }, client) => {
  const updates = _toUpdates({ survey, record, nodeDefs, nodes })
  await client.batch(updates.map((update) => queryByType[update.type](update, client)))
}

export const updateRecordStep = async ({ surveyId, recordUuid, stepId, tableDef }, client) => {
  const tableName = DataTable.getName(tableDef)

  return client.one(
    `UPDATE ${SchemaRdb.getName(surveyId)}.${tableName}
    SET ${DataTable.columnNameRecordStep} = $/stepId/
    WHERE ${DataTable.columnNameRecordUuid} = $/recordUuid/
    RETURNING uuid`,
    { recordUuid, stepId }
  )
}
