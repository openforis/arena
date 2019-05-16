const NodeDefTable = require('../../../../common/surveyRdb/nodeDefTable')
const ColProps = require('./dataColProps')

const getNames = NodeDefTable.getColNames

const getNamesAndType = nodeDefCol =>
  getNames(nodeDefCol).map(col =>
    `${col} ${ColProps.getColTypeProcessor(nodeDefCol)(col)}`
  )

const getValues = async (surveyInfo, nodeDefCol, nodeCol = {}, surveyIndex, client) => {
  const valueFnProcessor = ColProps.getColValueProcessor(nodeDefCol)
  const valueFn = await valueFnProcessor(surveyInfo, nodeDefCol, nodeCol, surveyIndex, client)
  const values = getNames(nodeDefCol).map(colName =>
    valueFn(nodeCol, colName)
  )
  return values
}

module.exports = {
  getNames,
  getNamesAndType,
  getValues,
}