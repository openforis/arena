import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefTable from '@common/surveyRdb/nodeDefTable'

import * as DataTable from './dataTable'
import * as DataCol from './dataCol'

export const getName = NodeDefTable.getViewName

export const alias = `a`
export const aliasParent = `p`

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

  // add record_uuid, date_created, date_modified
  fields.unshift(
    `${NodeDef.isRoot(nodeDef) ? alias : aliasParent}.${DataTable.colNameRecordUuuid}`,
    `${alias}.${DataTable.colNameRecordCycle}`,
    `${alias}.date_created`,
    `${alias}.date_modified`
  )

  return fields
}

const getCols = (survey, nodeDef, isSelf) => {
  const fields = R.pipe(
    R.map(DataCol.getNames),
    R.flatten,
    R.map(name => `${isSelf ? alias : aliasParent}.${name}`),
  )(DataTable.getNodeDefColumns(survey, nodeDef))

  // if is not root, prepend parent uuid
  if (!NodeDef.isRoot(nodeDef))
    fields.unshift(`${aliasParent}.${getColUuid(Survey.getNodeDefParent(nodeDef)(survey))}`)

  // if nodeDef isSelf (starting nodeDef) prepend col uuid
  if (isSelf)
    fields.unshift(`${alias}.${DataTable.colNameUuuid} as ${getColUuid(nodeDef)}`)

  return fields
}

export const getJoin = (schemaName, nodeDefParent) =>
  nodeDefParent
    ? `JOIN 
       ${schemaName}.${getName(nodeDefParent)} as ${aliasParent}
       ON ${aliasParent}.${getColUuid(nodeDefParent)} = ${alias}.${DataTable.colNameParentUuuid}
      `
    : ''
