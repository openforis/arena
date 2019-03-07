const R = require('ramda')

const DateTimeUtils = require('../../../../../common/dateUtils')
const NumberUtils = require('../../../../../common/numberUtils')

const Survey = require('../../../../../common/survey/survey')
const NodeDef = require('../../../../../common/survey/nodeDef')
const { nodeDefType } = NodeDef
const Category = require('../../../../../common/survey/category')
const Node = require('../../../../../common/record/node')

const CategoryManager = require('../../../category/persistence/categoryManager')
const taxonomyRepository = require('../../../../taxonomy/taxonomyRepository')

const errorKeys = {
  invalidType: 'invalidType',
}

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
  return nodeDefLevelIndex === itemLevelIndex
}

const validateTaxon = async (survey, nodeDef, node) => {
  const taxonUuid = Node.getNodeTaxonUuid(node)
  if (!taxonUuid)
    return true

  const surveyId = Survey.getId(survey)
  const isSurveyDraft = Survey.isDraft(Survey.getSurveyInfo(survey))

  // taxon not found
  const taxon = await taxonomyRepository.fetchTaxonByUuid(surveyId, taxonUuid, isSurveyDraft)
  if (!taxon)
    return false

  const vernacularNameUuid = Node.getNodeVernacularNameUuid(node)
  if (!vernacularNameUuid)
    return true

  // vernacular name not found
  const vernacularName = await taxonomyRepository.fetchTaxonVernacularNameByUuid(surveyId, vernacularNameUuid, isSurveyDraft)
  return !!vernacularName
}

const validateValueType = (survey, nodeDef) =>
  async (propName, node) => {

    if (Node.isNodeValueBlank(node))
      return null

    const typeValidatorFn = typeValidatorFns[NodeDef.getType(nodeDef)]
    const valid = await typeValidatorFn(survey, nodeDef, node, Node.getNodeValue(node))
    return valid ? null : errorKeys.invalidType
  }

module.exports = {
  validateValueType
}