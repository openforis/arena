import * as R from 'ramda'

// MOVE import from table
import * as NodeDefTable from '@common/surveyRdb/nodeDefTable'
import * as ColProps from './dataColProps'

export const getNames = NodeDefTable.getColumnNames
export const getName = NodeDefTable.getColumnName

export const getValuesByColumnName = ({ survey, nodeDefCol, nodeCol = {} }) => {
  const valueFnProcessor = ColProps.getColValueProcessor(nodeDefCol)
  const valueFn = valueFnProcessor({ survey, nodeDefCol, nodeCol })
  return getNames(nodeDefCol).reduce((acc, columnName) => {
    acc[columnName] = valueFn(nodeCol, columnName)
    return acc
  }, {})
}

export const getValues = (survey, nodeDefCol, nodeCol = {}) => {
  const valuesByColumnName = getValuesByColumnName({ survey, nodeDefCol, nodeCol })
  return Object.values(valuesByColumnName)
}

export const getValue = R.pipe(getValues, R.head)
