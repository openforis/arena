import * as R from 'ramda'

// MOVE import from table
import * as NodeDefTable from '@common/surveyRdb/nodeDefTable'
import * as ColProps from './dataColProps'

const getValuesByColumnName = ({ survey, nodeDefCol, nodeCol = {} }) => {
  const valueFnProcessor = ColProps.getColValueProcessor(nodeDefCol)
  const valueFn = valueFnProcessor({ survey, nodeDefCol, nodeCol })
  return NodeDefTable.getColumnNames(nodeDefCol).reduce((acc, columnName) => {
    acc[columnName] = valueFn(nodeCol, columnName)
    return acc
  }, {})
}

const getValues = (survey, nodeDefCol, nodeCol = {}) => {
  const valuesByColumnName = getValuesByColumnName({ survey, nodeDefCol, nodeCol })
  return Object.values(valuesByColumnName)
}

const getValue = R.pipe(getValues, R.head)

export const TableDataNodeDefColUtils = {
  getValue,
  getValues,
  getValuesByColumnName,
}
