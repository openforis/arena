import * as R from 'ramda'

// MOVE import from table
import * as NodeDefTable from '@common/surveyRdb/nodeDefTable'
import * as ColProps from './dataColProps'

export const getNames = NodeDefTable.getColumnNames
export const getName = NodeDefTable.getColumnName

export const getValues = (survey, nodeDefCol, nodeCol = {}) => {
  const valueFnProcessor = ColProps.getColValueProcessor(nodeDefCol)
  const valueFn = valueFnProcessor({ survey, nodeDefCol, nodeCol })
  const values = getNames(nodeDefCol).map((columnName) => valueFn(nodeCol, columnName))
  return values
}

export const getValue = R.pipe(getValues, R.head)
