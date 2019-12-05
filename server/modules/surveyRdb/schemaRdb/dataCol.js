import * as R from 'ramda'

import * as NodeDefTable from '@common/surveyRdb/nodeDefTable'
import * as ColProps from './dataColProps'

export const getNames = NodeDefTable.getColNames
export const getName = NodeDefTable.getColName

export const getNamesAndType = nodeDefCol =>
  getNames(nodeDefCol).map(col => `${col} ${ColProps.getColTypeProcessor(nodeDefCol)(col)}`)

export const getValues = (survey, nodeDefCol, nodeCol = {}) => {
  const valueFnProcessor = ColProps.getColValueProcessor(nodeDefCol)
  const valueFn = valueFnProcessor(survey, nodeDefCol, nodeCol)
  const values = getNames(nodeDefCol).map(colName => valueFn(nodeCol, colName))
  return values
}

export const getValue = R.pipe(getValues, R.head)
