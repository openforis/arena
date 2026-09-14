import * as Expression from '@core/expressionParser/expression'

import { CallCategoryItemPropEditor } from './callCategoryItemPropEditor'
import { CallCountEditor } from './callCountEditor'
import { CallDateTimeDiffEditor } from './callDateTimeDiffEditor'
import { CallGeoDistanceEditor } from './callGeoDistanceEditor'
import { CallGeoCoordinateAtDistanceEditor } from './callGeoCoordinateAtDistanceEditor'
import { CallIncludesEditor } from './callIncludesEditor'
import { CallIsEmptyEditor } from './callIsEmptyEditor'
import { CallIsNotEmptyEditor } from './callIsNotEmptyEditor'
import { CallNumberToWordsEditor } from './callNumberToWordsEditor'
import { CallTaxonPropEditor } from './callTaxonPropEditor'
import { CallTaxonVernacularNameEditor } from './callTaxonVernacularNameEditor'
import { CallUserPropEditor } from './callUserPropEditor'

const { functionNames } = Expression

const complexFunctions = {
  rowIndex: {
    labelKey: 'nodeDefEdit.functionName.rowIndex',
    exprString: 'index($context)',
  },
}

export const functions = {
  [functionNames.categoryItemProp]: {
    label: 'categoryItemProp(...)',
    component: CallCategoryItemPropEditor,
  },
  [functionNames.count]: {
    label: 'count(...)',
    component: CallCountEditor,
  },
  [functionNames.dateTimeDiff]: {
    label: 'dateTimeDiff(...)',
    component: CallDateTimeDiffEditor,
  },
  [functionNames.distance]: {
    label: 'distance(...)',
    component: CallGeoDistanceEditor,
  },
  [functionNames.geoCoordinateAtDistance]: {
    label: 'geoCoordinateAtDistance(...)',
    component: CallGeoCoordinateAtDistanceEditor,
  },
  [functionNames.geoDistance]: {
    label: 'geoDistance(...)',
    component: CallGeoDistanceEditor,
  },
  [functionNames.includes]: {
    label: 'includes(...)',
    component: CallIncludesEditor,
  },
  [functionNames.isEmpty]: {
    label: 'isEmpty(...)',
    component: CallIsEmptyEditor,
  },
  [functionNames.isNotEmpty]: {
    label: 'isNotEmpty(...)',
    component: CallIsNotEmptyEditor,
  },
  [functionNames.now]: {
    callee: functionNames.now,
  },
  [functionNames.numberToWords]: {
    label: 'numberToWords(...)',
    component: CallNumberToWordsEditor,
  },
  [functionNames.recordCycle]: {
    callee: functionNames.recordCycle,
  },
  [functionNames.recordDateCreated]: {
    callee: functionNames.recordDateCreated,
  },
  [functionNames.recordDateLastModified]: {
    callee: functionNames.recordDateLastModified,
  },
  [functionNames.recordOwnerEmail]: {
    callee: functionNames.recordOwnerEmail,
  },
  [functionNames.recordOwnerName]: {
    callee: functionNames.recordOwnerName,
  },
  [functionNames.recordOwnerRole]: {
    callee: functionNames.recordOwnerRole,
  },
  rowIndex: complexFunctions.rowIndex,
  [functionNames.taxonProp]: {
    label: 'taxonProp(...)',
    component: CallTaxonPropEditor,
  },
  [functionNames.taxonVernacularName]: {
    label: 'taxonVernacularName(...)',
    component: CallTaxonVernacularNameEditor,
  },
  [functionNames.userEmail]: {
    callee: functionNames.userEmail,
  },
  [functionNames.userIsRecordOwner]: {
    callee: functionNames.userIsRecordOwner,
  },
  [functionNames.userName]: {
    callee: functionNames.userName,
  },
  [functionNames.userProp]: {
    label: 'userProp(...)',
    component: CallUserPropEditor,
  },
  [functionNames.uuid]: {
    callee: functionNames.uuid,
  },
}

export const getComplexFunctionNameByExpression = (exprString) => {
  if (!exprString) return null
  return Object.keys(complexFunctions).find((key) => {
    const funcObj = complexFunctions[key]
    return funcObj.exprString === exprString
  })
}
