import type { ArenaAnyNodeDef, ArenaSurvey } from '@openforis/arena-core'

// MOVE import from table
import * as NodeDefTable from '@common/surveyRdb/nodeDefTable'

import * as ColProps from './dataColProps'

const getValuesByColumnName = ({
  survey,
  nodeDefCol,
  nodeCol = {},
}: {
  survey: ArenaSurvey
  nodeDefCol: ArenaAnyNodeDef
  nodeCol?: Record<string, any>
}): Record<string, unknown> => {
  const valueFnProcessor = ColProps.getColValueProcessor(nodeDefCol)
  const valueFn = valueFnProcessor({ survey, nodeDefCol, nodeCol })
  const valuesByColumnName: Record<string, unknown> = {}
  for (const columnName of NodeDefTable.getColumnNames(nodeDefCol)) {
    valuesByColumnName[columnName] = valueFn(nodeCol, columnName)
  }
  return valuesByColumnName
}

const getValues = (survey: ArenaSurvey, nodeDefCol: ArenaAnyNodeDef, nodeCol: Record<string, any> = {}): unknown[] => {
  const valuesByColumnName = getValuesByColumnName({ survey, nodeDefCol, nodeCol })
  return Object.values(valuesByColumnName)
}

const getValue = (survey: ArenaSurvey, nodeDefCol: ArenaAnyNodeDef, nodeCol: Record<string, any> = {}): unknown =>
  getValues(survey, nodeDefCol, nodeCol)[0]

export const TableDataNodeDefColUtils = {
  getValue,
  getValues,
  getValuesByColumnName,
}
