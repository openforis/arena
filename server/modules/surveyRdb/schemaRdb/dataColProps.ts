import * as R from 'ramda';
import camelize from 'camelize';
import ObjectUtils from '../../../../core/objectUtils';
import Survey from '../../../../core/survey/survey';
import NodeDef, { INodeDef } from '../../../../core/survey/nodeDef';
import Taxon from '../../../../core/survey/taxon';
import Node from '../../../../core/record/node';
import NodeDefTable from '../../../../common/surveyRdb/nodeDefTable';
import sqlTypes from '../../../../common/surveyRdb/sqlTypes';
const { nodeDefType } = NodeDef

import Point from '../../../../core/geo/point';
import GeoUtils from '../../../../core/geo/geoUtils';
import DateTimeUtils from '../../../../core/dateUtils';

const COL_VALUE_PROCESSOR = 'colValueProcessor'
const COL_TYPE_PROCESSOR = 'colTypeProcessor'

const getValueFromItem = (nodeDefCol: INodeDef, colName: string, item = {}, isInProps = false) => {
  //remove nodeDefName from col name
  const prop = camelize(NodeDefTable.extractColName(nodeDefCol, colName))

  return isInProps
    ? NodeDef.getProp(prop)(item)
    : R.propOr(null, prop, item)
}

const nodeValuePropProcessor = (survey: any, nodeDefCol: any, nodeCol: any) =>
  (node: {}, colName: any) => {
    const nodeValue = Node.getValue(node)
    return getValueFromItem(nodeDefCol, colName, nodeValue)
  }


type ProcessorFn = (survey?: any, nodeDefCol?: any, nodeCol?: any) => (node?: any, colName?: any) => string;
interface IProps {
  [type: string]: {
    colValueProcessor?: ProcessorFn;
    colTypeProcessor?: ProcessorFn;
  }
}
const props: IProps = {
  [nodeDefType.entity]: {
    colValueProcessor: () => () => Node.getUuid,
    colTypeProcessor: () => () => sqlTypes.uuid,
  },

  [nodeDefType.integer]: {
    colTypeProcessor: () => () => sqlTypes.integer,
  },

  [nodeDefType.decimal]: {
    colTypeProcessor: () => () => sqlTypes.decimal,
  },

  [nodeDefType.date]: {
    colTypeProcessor: () => () => sqlTypes.date,
    colValueProcessor: (survey, nodeDefCol, nodeCol) => {
      const [year, month, day] = [Node.getDateYear(nodeCol), Node.getDateMonth(nodeCol), Node.getDateDay(nodeCol)]
      return () => DateTimeUtils.isValidDate(year, month, day) ? `${year}-${month}-${day}` : null
    }
  },

  [nodeDefType.time]: {
    colTypeProcessor: () => () => sqlTypes.time,
    colValueProcessor: (survey, nodeDefCol, nodeCol) => {
      const [hour, minute] = [Node.getTimeHour(nodeCol), Node.getTimeMinute(nodeCol)]
      return () => DateTimeUtils.isValidTime(hour, minute) ? `${hour}:${minute}:00` : null
    }
  },

  [nodeDefType.code]: {
    colValueProcessor: (survey, nodeDefCol, nodeCol) => {
      const surveyInfo = Survey.getSurveyInfo(survey)
      const itemUuid = Node.getCategoryItemUuid(nodeCol)
      const item = itemUuid ? Survey.getCategoryItemByUuid(itemUuid)(survey) : {}

      return (node, colName) => R.endsWith('code', colName)
        ? getValueFromItem(nodeDefCol, colName, item, true)
        //'label'
        : ObjectUtils.getLabel(Survey.getDefaultLanguage(surveyInfo))(item)
    },
  },

  [nodeDefType.taxon]: {
    colValueProcessor: (survey, nodeDefCol, nodeCol) => {
      // return (node, colName) => null
      const taxonUuid = Node.getTaxonUuid(nodeCol)
      const taxon = taxonUuid ? Survey.getTaxonByUuid(taxonUuid)(survey) : {}

      return (node, colName) =>
        R.endsWith('code', colName)
          ? Taxon.getCode(taxon)
          // scientific_name
          : Taxon.isUnlistedTaxon(taxon)
          ? Node.getScientificName(node) //from node value
          : Taxon.getScientificName(taxon) //from taxon item
    },
  },

  [nodeDefType.coordinate]: {
    colValueProcessor: (survey, nodeDefCol, nodeCol) => {
      const [x, y, srsCode] = [Node.getCoordinateX(nodeCol), Node.getCoordinateY(nodeCol), Node.getCoordinateSrs(nodeCol)]

      return () => GeoUtils.isCoordinateValid(srsCode, x, y)
        ? Point.newPoint(srsCode, x, y)
        : null
    },
    colTypeProcessor: () => () => sqlTypes.point,
  },

  [nodeDefType.file]: {
    colValueProcessor: nodeValuePropProcessor,
    colTypeProcessor: () => colName => R.endsWith('file_uuid', colName) ? sqlTypes.uuid : sqlTypes.varchar,
  },
}

const getColValueProcessor: (nodeDef: INodeDef) => ProcessorFn
= (nodeDef: INodeDef) => R.propOr(
  () => (node: {}) => {
    return Node.isValueBlank(node)
      ? null
      : Node.getValue(node)
  },
  COL_VALUE_PROCESSOR,
  props[NodeDef.getType(nodeDef)]
)

const getColTypeProcessor: (nodeDef: INodeDef) => ProcessorFn
// @ts-ignore TODO wasn't able to typecheck the last line.
= nodeDef => R.propOr(
  (_nodeDef: any) => (_colName: any) => 'VARCHAR',
  COL_TYPE_PROCESSOR,
  props[NodeDef.getType(nodeDef)],
)(nodeDef)

export default {
  getColValueProcessor,
  getColTypeProcessor,
};
