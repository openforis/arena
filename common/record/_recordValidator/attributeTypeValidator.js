const R = require('ramda')

const DateTimeUtils = require('../../dateUtils')
const NumberUtils = require('../../numberUtils')

const Survey = require('../../survey/survey')
const NodeDef = require('../../survey/nodeDef')
const { nodeDefType } = NodeDef
const Taxon = require('../../survey/taxon')

const Node = require('../node')
const GeoUtils = require('../../geo/geoUtils')

const Validation = require('../../validation/validation')

const typeValidatorFns = {
  [nodeDefType.boolean]: (survey, nodeDef, node, value) =>
    R.includes(value, ['true', 'false']),

  [nodeDefType.code]: (survey, nodeDef, node, value) =>
    validateCode(survey, nodeDef, node),

  [nodeDefType.coordinate]: (survey, nodeDef, node, value) =>
    GeoUtils.isCoordinateValid(
      Node.getCoordinateSrs(node),
      Node.getCoordinateX(node),
      Node.getCoordinateY(node)
    )
  ,

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

const validateCode = (survey, nodeDef, node) => {
  const itemUuid = Node.getCategoryItemUuid(node)
  if (!itemUuid)
    return true

  // item not found
  const item = Survey.getCategoryItemByUuid(itemUuid)(survey)
  return !!item
}

const validateTaxon = (survey, nodeDef, node) => {
  const taxonUuid = Node.getTaxonUuid(node)
  if (!taxonUuid)
    return true

  // taxon not found
  const taxon = Survey.getTaxonByUuid(taxonUuid)(survey)
  if (!taxon)
    return false

  const vernacularNameUuid = Node.getVernacularNameUuid(node)
  if (!vernacularNameUuid)
    return true

  // vernacular name not found
  return Survey.includesTaxonVernacularName(nodeDef, Taxon.getCode(taxon), vernacularNameUuid)(survey)
}

const validateValueType = (survey, nodeDef) => (propName, node) => {
  if (Node.isValueBlank(node))
    return null

  const typeValidatorFn = typeValidatorFns[NodeDef.getType(nodeDef)]
  const valid = typeValidatorFn(survey, nodeDef, node, Node.getValue(node))
  return valid ? null : { key: Validation.messageKeys.record.valueInvalid }
}

module.exports = {
  validateValueType
}