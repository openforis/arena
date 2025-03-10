import { Objects, PointFactory, Points, Strings } from '@openforis/arena-core'

import * as A from '@core/arena'
import * as DateTimeUtils from '@core/dateUtils'
import * as NumberUtils from '@core/numberUtils'
import * as StringUtils from '@core/stringUtils'
import * as Srs from '@core/geo/srs'
import * as Node from '@core/record/node'
import * as NodeRefData from '@core/record/nodeRefData'
import * as CategoryItem from '@core/survey/categoryItem'
import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'
import * as Taxon from '@core/survey/taxon'
import * as TaxonVernacularName from '@core/survey/taxonVernacularName'

import ColumnNodeDef from './columnNodeDef'

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

const _extractVernacularNameAndLang = ({ taxon, vernacularNameUuid }) => {
  let vernacularName, vernacularLang
  const vernacularNameObj = Taxon.getVernacularNameObjByUuid(vernacularNameUuid)(taxon)
  if (vernacularNameObj) {
    vernacularName = TaxonVernacularName.getName(vernacularNameObj)
    vernacularLang = TaxonVernacularName.getLang(vernacularNameObj)
  } else {
    vernacularName = Taxon.getVernacularName(taxon)
    vernacularLang = Taxon.getVernacularLanguage(taxon)
  }
  return vernacularName ? { vernacularName, vernacularLang } : {}
}

/**
 * Convert an input value to RDB compatible output value.
 * The contract is such that the value output value must always be compatible with RDB.
 * In case of any errors, return NULL.
 */
const props = {
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
  [nodeDefType.coordinate]: {
    [colValueProcessor]:
      ({ survey }) =>
      (node, columnName) => {
        const valueProps = Node.valuePropsCoordinate
        const valueProp = Object.values(valueProps).find((valueProp) => columnName.endsWith(`_${valueProp}`))
        if (valueProp) {
          const nodeValue = Node.getValue(node)
          const fieldValue = nodeValue[valueProp]
          if (Objects.isEmpty(fieldValue)) return null
          return valueProp === valueProps.srs
            ? StringUtils.prependIfMissing(Srs.idPrefix)(String(fieldValue))
            : Number(fieldValue)
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
  [nodeDefType.date]: {
    [colValueProcessor]: ({ nodeCol }) => {
      const [year, month, day] = [Node.getDateYear(nodeCol), Node.getDateMonth(nodeCol), Node.getDateDay(nodeCol)]
      return () => (DateTimeUtils.isValidDate(year, month, day) ? `${year}-${month}-${day}` : null)
    },
  },
  [nodeDefType.decimal]: {
    [colValueProcessor]: ({ nodeCol }) => {
      const value = Node.getValue(nodeCol)
      const num = NumberUtils.toNumber(value)
      return () => (!Number.isNaN(num) && Number.isFinite(num) ? num : null)
    },
  },
  [nodeDefType.entity]: {
    [colValueProcessor]: () => () => Node.getUuid,
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
  [nodeDefType.integer]: {
    [colValueProcessor]: ({ nodeCol }) => {
      const value = Node.getValue(nodeCol)
      const num = NumberUtils.toNumber(value)
      return () => (Number.isInteger(num) ? num : null)
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
        if (columnName.endsWith(ColumnNodeDef.columnSuffixTaxonVernacularName)) {
          // Vernacular name
          const vernacularNameUuid = Node.getVernacularNameUuid(node)
          if (vernacularNameUuid) {
            const { vernacularName, vernacularLang } = _extractVernacularNameAndLang({ taxon, vernacularNameUuid })
            return vernacularName ? `${vernacularName} (${vernacularLang})` : null
          } else if (Taxon.isUnkOrUnlTaxon(taxon)) {
            return Node.getVernacularName(node)
          }
        }
        return null
      }
    },
  },
  [nodeDefType.time]: {
    [colValueProcessor]: ({ nodeCol }) => {
      const [hour, minute] = [Node.getTimeHour(nodeCol), Node.getTimeMinute(nodeCol)]
      return () => (DateTimeUtils.isValidTime(hour, minute) ? `${hour}:${minute}:00` : null)
    },
  },
}

export const getColValueProcessor = (nodeDef) =>
  A.propOr(
    () => (node) => (Node.isValueBlank(node) ? null : Node.getValue(node)),
    colValueProcessor,
    props[NodeDef.getType(nodeDef)]
  )
