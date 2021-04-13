import * as R from 'ramda'

import { PointFactory, Points } from '@openforis/arena-core'

import * as DateTimeUtils from '@core/dateUtils'
import * as NumberUtils from '@core/numberUtils'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Taxon from '@core/survey/taxon'

import * as Validation from '@core/validation/validation'

import * as Node from '../node'

const { nodeDefType } = NodeDef

const typeValidatorFns = {
  [nodeDefType.boolean]: (_survey, _nodeDef, _node, value) => R.includes(value, ['true', 'false']),

  [nodeDefType.code]: (survey, nodeDef, node, _value) => validateCode(survey, nodeDef, node),

  [nodeDefType.coordinate]: (_survey, _nodeDef, node, _value) => {
    const point = PointFactory.createInstance({
      srs: Node.getCoordinateSrs(node),
      x: Node.getCoordinateX(node),
      y: Node.getCoordinateY(node),
    })
    return point && Points.isValid(point)
  },

  [nodeDefType.date]: (_survey, _nodeDef, node, _value) => {
    const [year, month, day] = [Node.getDateYear(node), Node.getDateMonth(node), Node.getDateDay(node)]
    return DateTimeUtils.isValidDate(year, month, day)
  },

  [nodeDefType.decimal]: (_survey, nodeDef, _node, value) => validateDecimal({ nodeDef, value }),

  [nodeDefType.file]: (_survey, _nodeDef, _node, _value) => true,

  [nodeDefType.integer]: (_survey, _nodeDef, _node, value) => NumberUtils.isInteger(value),

  [nodeDefType.taxon]: (survey, nodeDef, node, _value) => validateTaxon(survey, nodeDef, node),

  [nodeDefType.text]: (_survey, _nodeDef, _node, value) => R.is(String, value),

  [nodeDefType.time]: (_survey, _nodeDef, node, _value) => {
    const [hour, minute] = [Node.getTimeHour(node), Node.getTimeMinute(node)]
    return DateTimeUtils.isValidTime(hour, minute)
  },
}

const validateDecimal = ({ nodeDef, value }) => {
  if (!NumberUtils.isFloat(value)) return false
  const maxNumberDecimalDigits = NodeDef.getMaxNumberDecimalDigits(nodeDef)
  const numberDecimalDigits = (Number(value).toString().split('.')[1] || '').length
  return numberDecimalDigits <= maxNumberDecimalDigits
}

const validateCode = (survey, _nodeDef, node) => {
  const itemUuid = Node.getCategoryItemUuid(node)
  if (!itemUuid) {
    return true
  }

  // Item not found
  const item = Survey.getCategoryItemByUuid(itemUuid)(survey)
  return Boolean(item)
}

const validateTaxon = (survey, nodeDef, node) => {
  const taxonUuid = Node.getTaxonUuid(node)
  if (!taxonUuid) {
    return true
  }

  // Taxon not found
  const taxon = Survey.getTaxonByUuid(taxonUuid)(survey)
  if (!taxon) {
    return false
  }

  const vernacularNameUuid = Node.getVernacularNameUuid(node)
  if (!vernacularNameUuid) {
    return true
  }

  // Vernacular name not found
  return Survey.includesTaxonVernacularName(nodeDef, Taxon.getCode(taxon), vernacularNameUuid)(survey)
}

export const validateValueType = (survey, nodeDef) => (_propName, node) => {
  if (Node.isValueBlank(node)) {
    return null
  }

  const typeValidatorFn = typeValidatorFns[NodeDef.getType(nodeDef)]
  const valid = typeValidatorFn(survey, nodeDef, node, Node.getValue(node))
  return valid ? null : { key: Validation.messageKeys.record.valueInvalid }
}
