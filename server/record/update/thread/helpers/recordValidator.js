const R = require('ramda')
const Promise = require('bluebird')

const {dependencyTypes} = require('../../../../survey/surveyDependenchyGraph')
const Survey = require('../../../../../common/survey/survey')
const NodeDef = require('../../../../../common/survey/nodeDef')
const NodeDefExpression = require('../../../../../common/survey/nodeDefExpression')
const NodeDefValidations = require('../../../../../common/survey/nodeDefValidations')
const Node = require('../../../../../common/record/node')
const Validator = require('../../../../../common/validation/validator')

const NodeDependencyManager = require('../nodeDependencyManager')
const RecordExprParser = require('../../../recordExprParser')

const DateTimeUtils = require('../../../../../common/dateUtils')

const errorKeys = {
  required: 'required',
  invalidValue: 'invalidValue'
}

const validateValueType = (survey, nodeDef) => (propName, node) => {
  if (Node.isNodeValueBlank(node))
    return null

  const value = Node.getNodeValue(node)

  switch (NodeDef.getType(nodeDef)) {
    case NodeDef.nodeDefType.integer:
      return isInteger(value) ? null : errorKeys.invalidValue
    case NodeDef.nodeDefType.decimal:
      return isFloat(value) ? null : errorKeys.invalidValue
    case NodeDef.nodeDefType.boolean:
      return R.includes(value, ['true', 'false']) ? null : errorKeys.invalidValue
    case NodeDef.nodeDefType.coordinate:
      return isFloat(Node.getCoordinateX(node))
      && isFloat(Node.getCoordinateY(node))
      && R.includes(Node.getCoordinateSrs(node), Survey.getSRS(survey))
        ? null : errorKeys.invalidValue
    case NodeDef.nodeDefType.date:
      const [year, month, day] = [Node.getDateYear(node), Node.getDateMonth(node), Node.getDateDay(node)]
      return DateTimeUtils.isValidDate(year, month, day) ? null : errorKeys.invalidValue
    case NodeDef.nodeDefType.time:
      const [hour, minute] = [Node.getTimeHour(node), Node.getTimeMinute(node)]
      return DateTimeUtils.isValidTime(hour, minute) ? null : errorKeys.invalidValue
    case NodeDef.nodeDefType.file:
      return null //TODO
    case NodeDef.nodeDefType.code:
      return null //TODO
    case NodeDef.nodeDefType.text:
      return R.is(String, value)
    case NodeDef.nodeDefType.taxon:
      return null //TODO
  }
}

const validateNodeValidations = (survey, nodeDef, tx) => async (propName, node) => {
  const validations = NodeDef.getValidations(nodeDef)
  if (Node.isNodeValueBlank(node)) {
    return NodeDefValidations.isRequired(validations)
      ? errorKeys.required
      : null
  }
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
      R.join('\n')
    )(invalidExpressions)
}

const validateNodes = async (survey, nodes, tx) => {

  const validatedNodeUuids = []

  const validationsByNode = R.pipe(
    R.flatten,
    R.mergeAll,
  )(await Promise.all(R.values(nodes).map(
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

      const nodesValidated = await Promise.all(
        nodesToValidate.map(async o => {
          const {nodeCtx, nodeDef} = o
          return {
            [Node.getUuid(nodeCtx)]: await Validator.validate(nodeCtx, {
              [Node.keys.value]: [validateValueType(survey, nodeDef), validateNodeValidations(survey, nodeDef)]
            })
          }
        })
      )

      validatedNodeUuids.push(R.pluck(Node.keys.uuid, nodesToValidate))

      return nodesValidated
    }))
  )
  return {
    fields: validationsByNode
  }
}

const isInteger = value => /^\d+$/.test(value)

const isFloat = value => /^\d+(\.\d+)?$/.test(value)

module.exports = {
  validateNodes
}