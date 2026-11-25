import type { ComponentType } from 'react'

import * as Expression from '@core/expressionParser/expression'

import { CallCategoryItemPropEditor } from './CallCategoryItemPropEditor'
import { CallCountEditor } from './CallCountEditor'
import { CallDateTimeDiffEditor } from './CallDateTimeDiffEditor'
import { CallGeoAOIContainingEditor } from './CallGeoAOIContainingEditor'
import { CallGeoCoordinateAtDistanceEditor } from './CallGeoCoordinateAtDistanceEditor'
import { CallGeoDistanceEditor } from './CallGeoDistanceEditor'
import { CallGeoDistanceToAOIBoundaryEditor } from './CallGeoDistanceToAOIBoundaryEditor'
import { CallIncludesEditor } from './CallIncludesEditor'
import { CallIsEmptyEditor } from './CallIsEmptyEditor'
import { CallIsNotEmptyEditor } from './CallIsNotEmptyEditor'
import { CallNodeDateCreatedEditor, CallNodeDateModifiedEditor } from './CallNodeDateEditor'
import { CallNumberToWordsEditor } from './CallNumberToWordsEditor'
import { CallTaxonPropEditor } from './CallTaxonPropEditor'
import { CallTaxonVernacularNameEditor } from './CallTaxonVernacularNameEditor'
import { CallUserPropEditor } from './CallUserPropEditor'

const { functionNames } = Expression

const complexFunctions = {
  rowIndex: {
    labelKey: 'nodeDefEdit:functionName.rowIndex',
    exprString: 'index($context)',
  },
}

type CallFunction = {
  callee?: string
  component?: ComponentType<any>
  exprString?: string
  label?: string
  labelKey?: string
}

export const functions: Record<string, CallFunction> = {
  [functionNames.appId]: {
    callee: functionNames.appId,
  },
  [functionNames.appIdLabel]: {
    callee: functionNames.appIdLabel,
  },
  [functionNames.appPlatform]: {
    callee: functionNames.appPlatform,
  },
  [functionNames.appVersion]: {
    callee: functionNames.appVersion,
  },
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
  [functionNames.geoAOIContaining]: {
    label: 'geoAOIContaining(...)',
    component: CallGeoAOIContainingEditor,
  },
  [functionNames.geoCoordinateAtDistance]: {
    label: 'geoCoordinateAtDistance(...)',
    component: CallGeoCoordinateAtDistanceEditor,
  },
  [functionNames.geoDistance]: {
    label: 'geoDistance(...)',
    component: CallGeoDistanceEditor,
  },
  [functionNames.geoDistanceToAOIBoundary]: {
    label: 'geoDistanceToAOIBoundary(...)',
    component: CallGeoDistanceToAOIBoundaryEditor,
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
  [functionNames.nodeDateCreated]: {
    label: 'nodeDateCreated(...)',
    component: CallNodeDateCreatedEditor,
  },
  [functionNames.nodeDateModified]: {
    label: 'nodeDateModified(...)',
    component: CallNodeDateModifiedEditor,
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
