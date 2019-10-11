const R = require('ramda')

const NodeDefTable = require('../../../../core/surveyRdb/nodeDefTable')
const ColProps = require('./dataColProps')

const getNames = NodeDefTable.getColNames

const getNamesAndType = nodeDefCol =>
  getNames(nodeDefCol).map(col =>
    `${col} ${ColProps.getColTypeProcessor(nodeDefCol)(col)}`
  )

const getValues = (survey, nodeDefCol, nodeCol = {}) => {
  const valueFnProcessor = ColProps.getColValueProcessor(nodeDefCol)
  const valueFn = valueFnProcessor(survey, nodeDefCol, nodeCol)
  const values = getNames(nodeDefCol).map(colName =>
    valueFn(nodeCol, colName)
  )
  return values
}

const getValue = R.pipe(
  getValues,
  R.head
)

module.exports = {
  getNames,
  getNamesAndType,

  getValues,
  getValue,
}