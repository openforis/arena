import * as camelize from 'camelize'

import { Objects, PointFactory, Points } from '@openforis/arena-core'

import * as A from '@core/arena'
import * as NumberUtils from '@core/numberUtils'
import * as Survey from '@core/survey/survey'
import * as CategoryItem from '@core/survey/categoryItem'
import * as NodeDef from '@core/survey/nodeDef'
import * as Taxon from '@core/survey/taxon'
import * as Node from '@core/record/node'
import * as NodeRefData from '@core/record/nodeRefData'
import * as DateTimeUtils from '@core/dateUtils'

import * as NodeDefTable from '@common/surveyRdb/nodeDefTable'

const { nodeDefType } = NodeDef

const colValueProcessor = 'colValueProcessor'

const getValueFromItem = (nodeDefCol, columnName, item = {}, isInProps = false) => {
  // Remove nodeDefName from col name
  const prop = camelize(NodeDefTable.extractColumnName(nodeDefCol, columnName))

  return isInProps ? NodeDef.getProp(prop)(item) : A.propOr(null, prop, item)
}

const _extractCategoryItem = ({ survey, node }) => {
  let item = NodeRefData.getCategoryItem(node)
  if (item) return item

  const itemUuid = Node.getCategoryItemUuid(node)
  return itemUuid ? Survey.getCategoryItemByUuid(itemUuid)(survey) : null
}

const nodeValuePropProcessor =
  ({ nodeDefCol }) =>
  (node, columnName) => {
    const nodeValue = Node.getValue(node)
    return getValueFromItem(nodeDefCol, columnName, nodeValue)
  }

/**
 * Convert an input value to RDB compatible output value.
 * The contract is such that the value output value must always be compatible with RDB.
 * In case of any errors, return NULL.
 */
const props = {
  [nodeDefType.entity]: {
    [colValueProcessor]: () => () => Node.getUuid,
  },

  [nodeDefType.integer]: {
    [colValueProcessor]: ({ nodeCol }) => {
      const value = Node.getValue(nodeCol)
      const num = NumberUtils.toNumber(value)
      return () => (Number.isInteger(num) ? num : null)
    },
  },

  [nodeDefType.decimal]: {
    [colValueProcessor]: ({ nodeCol }) => {
      const value = Node.getValue(nodeCol)
      const num = NumberUtils.toNumber(value)
      return () => (!Number.isNaN(num) && Number.isFinite(num) ? num : null)
    },
  },

  [nodeDefType.date]: {
    [colValueProcessor]: ({ nodeCol }) => {
      const [year, month, day] = [Node.getDateYear(nodeCol), Node.getDateMonth(nodeCol), Node.getDateDay(nodeCol)]
      return () => (DateTimeUtils.isValidDate(year, month, day) ? `${year}-${month}-${day}` : null)
    },
  },

  [nodeDefType.time]: {
    [colValueProcessor]: ({ nodeCol }) => {
      const [hour, minute] = [Node.getTimeHour(nodeCol), Node.getTimeMinute(nodeCol)]
      return () => (DateTimeUtils.isValidTime(hour, minute) ? `${hour}:${minute}:00` : null)
    },
  },

  [nodeDefType.code]: {
    [colValueProcessor]: ({ survey, nodeCol }) => {
      const surveyInfo = Survey.getSurveyInfo(survey)
      const defaultLang = Survey.getDefaultLanguage(surveyInfo)

      const item = _extractCategoryItem({ survey, node: nodeCol })
      return (_node, columnName) => {
        if (!item) return null

        return columnName.endsWith('_label')
          ? CategoryItem.getLabel(defaultLang)(item) // label
          : CategoryItem.getCode(item) // code
      }
    },
  },

  [nodeDefType.taxon]: {
    [colValueProcessor]: ({ survey, nodeDefCol, nodeCol }) => {
      const taxonUuid = Node.getTaxonUuid(nodeCol)
      const taxon = taxonUuid ? Survey.getTaxonByUuid(taxonUuid)(survey) : {}

      return (node, columnName) => {
        if (NodeDef.getName(nodeDefCol) === columnName) {
          // Code
          return Taxon.getCode(taxon)
        }
        // Scientific_name
        if (Taxon.isUnkOrUnlTaxon(taxon)) {
          // Scientific name from node value
          return Node.getScientificName(node)
        }
        // Scientific name from taxon item
        return Taxon.getScientificName(taxon)
      }
    },
  },

  [nodeDefType.coordinate]: {
    [colValueProcessor]:
      ({ survey }) =>
      (node, columnName) => {
        const valueProp = Object.values(Node.valuePropsCoordinate).find((valueProp) =>
          columnName.endsWith(`_${valueProp}`)
        )
        if (valueProp) {
          const nodeValue = Node.getValue(node)
          const fieldValue = nodeValue[valueProp]
          if (Objects.isEmpty(fieldValue)) return null
          if (valueProp === Node.valuePropsCode.srs) return fieldValue
          return Number(fieldValue)
        }

        const surveyInfo = Survey.getSurveyInfo(survey)
        const srsIndex = Survey.getSRSIndex(surveyInfo)
        const [x, y, srs] = [Node.getCoordinateX(node), Node.getCoordinateY(node), Node.getCoordinateSrs(node)]
        const point = PointFactory.createInstance({ srs, x, y })
        if (point && Points.isValid(point, srsIndex)) {
          return Points.toString(point)
        }
        return null
      },
  },

  [nodeDefType.file]: {
    [colValueProcessor]: nodeValuePropProcessor,
  },
}

export const getColValueProcessor = (nodeDef) =>
  A.propOr(
    () => (node) => {
      return Node.isValueBlank(node) ? null : Node.getValue(node)
    },
    colValueProcessor,
    props[NodeDef.getType(nodeDef)]
  )
