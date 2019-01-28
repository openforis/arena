const R = require('ramda')
const Promise = require('bluebird')
const DateTimeUtils = require('../../../../../common/dateUtils')
const NumberUtils = require('../../../../../common/numberUtils')

const { dependencyTypes } = require('../../../../survey/surveyDependenchyGraph')
const Survey = require('../../../../../common/survey/survey')
const NodeDef = require('../../../../../common/survey/nodeDef')
const { nodeDefType } = NodeDef
const NodeDefExpression = require('../../../../../common/survey/nodeDefExpression')
const NodeDefValidations = require('../../../../../common/survey/nodeDefValidations')
const Category = require('../../../../../common/survey/category')

const Node = require('../../../../../common/record/node')
const Validator = require('../../../../../common/validation/validator')

const NodeDependencyManager = require('../nodeDependencyManager')
const RecordExprParser = require('../../../recordExprParser')

const CategoryManager = require('../../../../category/categoryManager')
const TaxonomyManager = require('../../../../taxonomy/taxonomyManager')
const RecordRepository = require('../../../../record/recordRepository')

const errorKeys = {
  required: 'required',
  invalidType: 'invalidType',
}

const validateRequired = (survey, nodeDef) =>
  (propName, node) => Node.isNodeValueBlank(node) && NodeDefValidations.isRequired(NodeDef.getValidations(nodeDef))
    ? errorKeys.required
    : null

const typeValidatorFns = {
  [nodeDefType.boolean]: (survey, nodeDef, node, value) =>
    R.includes(value, ['true', 'false']),

  [nodeDefType.code]: (survey, nodeDef, node, value) =>
    validateCode(survey, nodeDef, node),

  [nodeDefType.coordinate]: (survey, nodeDef, node, value) =>
    NumberUtils.isFloat(Node.getCoordinateX(node)) &&
    NumberUtils.isFloat(Node.getCoordinateY(node)) &&
    R.includes(Node.getCoordinateSrs(node), Survey.getSRS(survey)),

  [nodeDefType.date]: (survey, nodeDef, node, value) => {
    const [year, month, day] = [Node.getDateYear(node), Node.getDateMonth(node), Node.getDateDay(node)]
    return DateTimeUtils.isValidDate(year, month, day)
  },

  [nodeDefType.decimal]: (survey, nodeDef, node, value) =>
    NumberUtils.isFloat(value),

  [nodeDefType.file]: (survey, nodeDef, node, value) => true,

  [nodeDefType.integer]: (survey, nodeDef, node, value) =>
    NumberUtils.isInteger(value),

  [nodeDefType.taxon]: (survey, nodeDef, node, value) =>
    validateTaxon(survey, nodeDef, node),

  [nodeDefType.text]: (survey, nodeDef, node, value) =>
    R.is(String, value),

  [nodeDefType.time]: (survey, nodeDef, node, value) => {
    const [hour, minute] = [Node.getTimeHour(node), Node.getTimeMinute(node)]
    return DateTimeUtils.isValidTime(hour, minute)
  },
}

const validateValueType = (survey, nodeDef) =>
  async (propName, node) => {

    if (Node.isNodeValueBlank(node))
      return null

    const typeValidatorFn = typeValidatorFns[NodeDef.getType(nodeDef)]
    const valid = await typeValidatorFn(survey, nodeDef, node, Node.getNodeValue(node))
    return valid ? null : errorKeys.invalidType
  }

const validateNodeValidations = (survey, nodeDef, tx) => async (propName, node) => {
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
        const message = NodeDefExpression.getMessage(defaultLang, errorKeys.invalidType)(expr)

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

const validateNodes = async (survey, recordUuid, nodes, tx) => {

  const validatedNodeUuids = []

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

        const nodesValidated = await Promise.all(
          nodesToValidate.map(async o => {
            const { nodeCtx, nodeDef } = o
            const nodeUuid = Node.getUuid(nodeCtx)

            // mark node validated
            validatedNodeUuids.push(nodeUuid)

            return {
              [nodeUuid]: await Validator.validate(nodeCtx, {
                [Node.keys.value]: [
                  validateRequired(survey, nodeDef),
                  validateValueType(survey, nodeDef),
                  validateNodeValidations(survey, nodeDef, tx)
                ]
              })
            }
          })
        )

        return nodesValidated
      })
  )

  const nodesValidation = {
    fields: R.pipe(
      R.flatten,
      R.mergeAll
    )(nodesValidationArray)
  }

  // persist validation
  const record = await RecordRepository.fetchRecordByUuid(Survey.getId(survey), recordUuid, tx)

  const recordValidationUpdated = R.pipe(
    Validator.mergeValidation(nodesValidation),
    Validator.getValidation
  )(record)

  await RecordRepository.updateValidation(Survey.getId(survey), recordUuid, recordValidationUpdated, tx)

  return nodesValidation
}

const validateCode = async (survey, nodeDef, node) => {
  const itemUuid = Node.getCategoryItemUuid(node)
  if (!itemUuid)
    return true

  const surveyId = Survey.getId(survey)
  const isSurveyDraft = Survey.isDraft(Survey.getSurveyInfo(survey))

  const item = await CategoryManager.fetchItemByUuid(surveyId, itemUuid, isSurveyDraft)

  // item not found
  if (!item)
    return false

  const categoryUuid = NodeDef.getNodeDefCategoryUuid(nodeDef)
  const category = await CategoryManager.fetchCategoryByUuid(
    surveyId, categoryUuid, isSurveyDraft, false
  )
  const nodeDefLevelIndex = Survey.getNodeDefCategoryLevelIndex(nodeDef)(survey)
  const itemLevelIndex = Category.getItemLevelIndex(item)(category)

  // item category level different from node def category level
  if (nodeDefLevelIndex !== itemLevelIndex)
    return false

  return true
}

const validateTaxon = async (survey, nodeDef, node) => {
  const taxonUuid = Node.getNodeTaxonUuid(node)
  if (!taxonUuid)
    return true

  const surveyId = Survey.getId(survey)
  const isSurveyDraft = Survey.isDraft(Survey.getSurveyInfo(survey))

  // taxon not found
  const taxon = await TaxonomyManager.fetchTaxonByUuid(surveyId, taxonUuid, isSurveyDraft)
  if (!taxon)
    return false

  const vernacularNameUuid = Node.getNodeVernacularNameUuid(node)
  if (!vernacularNameUuid)
    return true

  // vernacular name not found
  const vernacularName = await TaxonomyManager.fetchTaxonVernacularNameByUuid(surveyId, vernacularNameUuid, isSurveyDraft)
  if (!vernacularName)
    return false

  return true
}

module.exports = {
  validateNodes
}