import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import * as SchemaRdb from '@common/surveyRdb/schemaRdb'
import * as NodeDefTable from '@common/surveyRdb/nodeDefTable'

import * as DataTable from './dataTable'
import * as DataCol from './dataCol'

export const getName = NodeDefTable.getViewName
export const getNameWithSchema = surveyId => nodeDef => `${SchemaRdb.getName(surveyId)}.${NodeDefTable.getViewName(nodeDef)}`

export const alias = 'a'
export const aliasParent = 'p'

export const columns = {
  keys: '_keys'
}

export const getColUuid = nodeDef => `${NodeDef.getName(nodeDef)}_${DataTable.colNameUuuid}`

export const getSelectFields = (survey, nodeDef) => {
  const fields = []
  Survey.visitAncestorsAndSelf(
    nodeDef,
    nodeDefCurrent => {
      const cols = getCols(
        survey,
        nodeDefCurrent,
        NodeDef.isEqual(nodeDefCurrent)(nodeDef)
      )
      fields.unshift(...cols)
    }
  )(survey)

  const fieldKey = R.pipe(
    Survey.getNodeDefKeys(nodeDef),
    R.map(nodeDefKey => `'${NodeDef.getUuid(nodeDefKey)}', ${alias}.${DataCol.getName(nodeDefKey)}`),
    R.join(', '),
    content => `jsonb_build_object(${content}) AS ${columns.keys}`
  )(survey)

  // Add record_uuid, date_created, date_modified, keys
  fields.unshift(
    `${NodeDef.isRoot(nodeDef) ? alias : aliasParent}.${DataTable.colNameRecordUuuid}`,
    `${alias}.${DataTable.colNameRecordCycle}`,
    `${alias}.date_created`,
    `${alias}.date_modified`,
    fieldKey,
  )

  return fields
}

const getCols = (survey, nodeDef, isSelf) => {
  const fields = R.pipe(
    R.map(DataCol.getNames),
    R.flatten,
    R.map(name => `${isSelf ? alias : aliasParent}.${name}`),
  )(DataTable.getNodeDefColumns(survey, nodeDef))

  // If is not root, prepend parent uuid
  if (!NodeDef.isRoot(nodeDef)) {
    fields.unshift(`${aliasParent}.${getColUuid(Survey.getNodeDefParent(nodeDef)(survey))}`)
  }

  // If nodeDef isSelf (starting nodeDef) prepend col uuid
  if (isSelf) {
    fields.unshift(`${alias}.${DataTable.colNameUuuid} as ${getColUuid(nodeDef)}`)
  }

  return fields
}

export const getJoin = (schemaName, nodeDefParent) =>
  nodeDefParent
    ? `JOIN 
       ${schemaName}.${getName(nodeDefParent)} as ${aliasParent}
       ON ${aliasParent}.${getColUuid(nodeDefParent)} = ${alias}.${DataTable.colNameParentUuuid}
      `
    : ''
