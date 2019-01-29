const R = require('ramda')
const Promise = require('bluebird')

const Survey = require('../../../../common/survey/survey')
const NodeDef = require('../../../../common/survey/nodeDef')
const NodeDefExpression = require('../../../../common/survey/nodeDefExpression')
const NodeDefValidations = require('../../../../common/survey/nodeDefValidations')
const { dependencyTypes } = require('../../../survey/surveyDependenchyGraph')
const Validator = require('../../../../common/validation/validator')
const Node = require('../../../../common/record/node')

const NodeDependencyManager = require('../../nodeDependencyManager')

const TypeValidator = require('./typeValidator')

const RecordExprParser = require('../../recordExprParser')

const errorKeys = {
  required: 'required',
  invalidValue: 'invalidValue',
}

const validateRequired = (survey, nodeDef) =>
  (propName, node) =>
    Node.isNodeValueBlank(node) &&
    (NodeDef.isNodeDefKey(nodeDef) || NodeDefValidations.isRequired(NodeDef.getValidations(nodeDef)))
      ? errorKeys.required
      : null

const validateNodeValidations = (survey, nodeDef, tx) =>
  async (propName, node) => {
    if (Node.isNodeValueBlank(node)) {
      return null
    }
    const validations = NodeDef.getValidations(nodeDef)

    const expressions = NodeDefValidations.getExpressions(validations)
    const applicableExpressions = await RecordExprParser.getApplicableExpressions(survey, node, expressions, tx)

    const applicableExpressionsEvaluated = await Promise.all(
      applicableExpressions.map(
        async expr => {
          const valid = await RecordExprParser.evalNodeQuery(survey, node, NodeDefExpression.getExpression(expr), tx)
          const defaultLang = Survey.getDefaultLanguage(Survey.getSurveyInfo(survey))
          const message = NodeDefExpression.getMessage(defaultLang, errorKeys.invalidValue)(expr)

          return {
            valid,
            message
          }
        }
      ))

    const invalidExpressions = R.filter(R.propEq('valid', false), applicableExpressionsEvaluated)

    return R.isEmpty(invalidExpressions)
      ? null
      : R.pipe(
        R.pluck('message'),
        R.join('; ')
      )(invalidExpressions)
  }

const validateSelfAndDependentNodes = async (survey, recordUuid, nodes, tx) => {

  const validatedNodeUuids = [] //used to avoid validating 2 times the same nodes

  const nodesValidationArray = await Promise.all(
    R.values(nodes).map(
      async node => {
        const nodeDependents = await NodeDependencyManager.fetchDependentNodes(
          survey,
          node,
          dependencyTypes.validations,
          tx
        )

        const nodesToValidate = R.pipe(
          R.append({
            nodeCtx: node,
            nodeDef: Survey.getNodeDefByUuid(Node.getNodeDefUuid(node))(survey)
          }),
          R.reject(o => NodeDef.isNodeDefEntity(o.nodeDef) || R.includes(Node.getUuid(o.nodeCtx), validatedNodeUuids)),
        )(nodeDependents)

        return await Promise.all(
          nodesToValidate.map(async o => {
            const { nodeCtx, nodeDef } = o
            const nodeUuid = Node.getUuid(nodeCtx)

            // mark node validated
            validatedNodeUuids.push(nodeUuid)

            return {
              [nodeUuid]: await Validator.validate(nodeCtx, {
                [Node.keys.value]: [
                  validateRequired(survey, nodeDef),
                  TypeValidator.validateValueType(survey, nodeDef),
                  validateNodeValidations(survey, nodeDef, tx)
                ]
              })
            }
          })
        )
      })
  )

  return R.pipe(
    R.flatten,
    R.mergeAll
  )(nodesValidationArray)
}

module.exports = {
  validateSelfAndDependentNodes
}