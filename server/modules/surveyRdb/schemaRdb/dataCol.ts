import * as R from 'ramda';
import NodeDefTable from '../../../../common/surveyRdb/nodeDefTable';
import ColProps from './dataColProps';

const getNames = NodeDefTable.getColNames

const getNamesAndType = nodeDefCol =>
  getNames(nodeDefCol).map(col =>
    `${col} ${ColProps.getColTypeProcessor(nodeDefCol)(col)}`
  )

const getValues: (survey, nodeDefCol, nodeCol?: any) => any[]
= (survey, nodeDefCol, nodeCol = {}) => {
  const valueFnProcessor = ColProps.getColValueProcessor(nodeDefCol)
  const valueFn = valueFnProcessor(survey, nodeDefCol, nodeCol)
  const values = getNames(nodeDefCol).map(colName =>
    valueFn(nodeCol, colName)
  )
  return values
}

const getValue: (survey, nodeDefCol, nodeCol?) => any = R.pipe(
  getValues,
  R.head
)

export default {
  getNames,
  getNamesAndType,

  getValues,
  getValue,
};
