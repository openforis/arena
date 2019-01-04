const R = require('ramda')
const Promise = require('bluebird')

const StringUtils = require('../../../../common/stringUtils')
const {toUuidIndexedObj} = require('../../../../common/survey/surveyUtils')

const Node = require('../../../../common/record/node')
const NodeDef = require('../../../../common/survey/nodeDef')
const Survey = require('../../../../common/survey/survey')
const NodeDefExpression = require('../../../../common/survey/nodeDefExpression')

const {dependencyTypes} = require('../../../survey/surveyDependenchyGraph')
const RecordExprParser = require('../../../record/recordExprParser')
const RecordDependencyManager = require('../../recordDependencyManager')
const RecordProcessor = require('./recordProcessor')

const isApplicable = async (survey, node, tx) => {
  const nodeDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(node))(survey)
  const applicableIfExpr = R.pipe(
    NodeDef.getApplicable,
    R.head,
    NodeDefExpression.getExpression
  )(nodeDef)

  return StringUtils.isBlank(applicableIfExpr)
    ? true
    : await RecordExprParser.evalNodeQuery(survey, node, applicableIfExpr, tx)
}

const updateDependentNodesApplicability = async (user, survey, nodes, tx) =>
  R.mergeAll(
    await Promise.all(
      R.values(nodes).map(async node => {
        const dependents = await RecordDependencyManager.fetchDependentNodes(survey, node, dependencyTypes.applicable, tx)

        return toUuidIndexedObj(
          await Promise.all(
            dependents.map(async dependent => ({
                ...dependent,
                applicable: await isApplicable(survey, dependent, tx)
              })
            )
          ))
      })
    )
  )

module.exports = {
  updateDependentNodesApplicability
}
