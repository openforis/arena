import { Objects, PointFactory, Points, Strings } from '@openforis/arena-core'

import * as A from '@core/arena'
import * as DateTimeUtils from '@core/dateUtils'
import * as NumberUtils from '@core/numberUtils'
import * as Node from '@core/record/node'
import * as NodeRefData from '@core/record/nodeRefData'
import * as CategoryItem from '@core/survey/categoryItem'
import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'
import * as Taxon from '@core/survey/taxon'

import { ColumnNodeDef } from '@common/model/db'

const { nodeDefType } = NodeDef

const colValueProcessor = 'colValueProcessor'

const _extractCategoryItem = ({ survey, node }) => {
  let item = NodeRefData.getCategoryItem(node)
  if (item) return item

  const itemUuid = Node.getCategoryItemUuid(node)
  return itemUuid ? Survey.getCategoryItemByUuid(itemUuid)(survey) : null
}

const _extractTaxon = ({ survey, node }) => {
  const taxonUuid = Node.getTaxonUuid(node)
  if (!taxonUuid) return null
  return NodeRefData.getTaxon(node) ?? Survey.getTaxonByUuid(taxonUuid)(survey)
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
      const taxon = _extractTaxon({ survey, node: nodeCol })

      return (node, columnName) => {
        if (Objects.isEmpty(Node.getValue(node))) return null

        if (NodeDef.getName(nodeDefCol) === columnName) {
          // Code
          return Taxon.getCode(taxon)
        }
        if (columnName.endsWith(ColumnNodeDef.columnSuffixTaxonScientificName)) {
          const taxonScientificName = Taxon.getScientificName(taxon)
          // Scientific_name
          if (Taxon.isUnkOrUnlTaxon(taxon)) {
            // Scientific name from node value
            const nodeScientificName = Node.getScientificName(node)
            return Strings.defaultIfEmpty(taxonScientificName)(nodeScientificName)
          }
          // Scientific name from taxon item
          return taxonScientificName
        }
        if (Node.getVernacularNameUuid(node) && columnName.endsWith(ColumnNodeDef.columnSuffixTaxonVernacularName)) {
          // Vernacular name
          const vernacularName = Taxon.getVernacularName(taxon)
          const vernacularLang = Taxon.getVernacularLanguage(taxon)
          return `${vernacularName} (${vernacularLang})`
        }
        return null
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
    [colValueProcessor]: ({ nodeDefCol }) => {
      const fileNameExpression = NodeDef.getFileNameExpression(nodeDefCol)
      return (node, columnName) => {
        if (columnName.endsWith(ColumnNodeDef.columnSuffixFileName)) {
          return fileNameExpression ? Node.getFileNameCalculated(node) : Node.getFileName(node)
        }
        if (columnName.endsWith(ColumnNodeDef.columnSuffixFileUuid)) {
          return Node.getFileUuid(node)
        }
        return null
      }
    },
  },
}

export const getColValueProcessor = (nodeDef) =>
  A.propOr(
    () => (node) => (Node.isValueBlank(node) ? null : Node.getValue(node)),
    colValueProcessor,
    props[NodeDef.getType(nodeDef)]
  )
