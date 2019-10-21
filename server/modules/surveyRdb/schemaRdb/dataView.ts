import * as R from 'ramda';
import Survey from '../../../../core/survey/survey';
import NodeDef from '../../../../core/survey/nodeDef';
import NodeDefTable from '../../../../common/surveyRdb/nodeDefTable';
import DataTable from './dataTable';
import DataCol from './dataCol';

const getName = NodeDefTable.getViewName

const alias = `a`
const aliasParent = `p`

const getColUuid = nodeDef => `${NodeDef.getName(nodeDef)}_${DataTable.colNameUuuid}`

const getSelectFields = (survey, nodeDef) => {
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

const getCols = (survey: any, nodeDef: any, isSelf: boolean) => {
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

const getJoin = (schemaName, nodeDefParent) =>
  nodeDefParent
    ? `JOIN
       ${schemaName}.${getName(nodeDefParent)} as ${aliasParent}
       ON ${aliasParent}.${getColUuid(nodeDefParent)} = ${alias}.${DataTable.colNameParentUuuid}
      `
    : ''

export default {
  alias,
  aliasParent,
  getName,
  getSelectFields,
  getJoin,
};
