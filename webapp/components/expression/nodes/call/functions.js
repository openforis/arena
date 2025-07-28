import * as Expression from '@core/expressionParser/expression'

import { CallCategoryItemPropEditor } from './callCategoryItemPropEditor'
import { CallCountEditor } from './callCountEditor'
import { CallDateTimeDiffEditor } from './callDateTimeDiffEditor'
import { CallDistanceEditor } from './callDistanceEditor'
import { CallIncludesEditor } from './callIncludesEditor'
import { CallIsEmptyEditor } from './callIsEmptyEditor'
import { CallIsNotEmptyEditor } from './callIsNotEmptyEditor'
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
  [functionNames.isEmpty]: {
    label: 'isEmpty(...)',
    component: CallIsEmptyEditor,
  },
  [functionNames.isNotEmpty]: {
    label: 'isNotEmpty(...)',
    component: CallIsNotEmptyEditor,
  },
  [functionNames.count]: {
    label: 'count(...)',
    component: CallCountEditor,
  },
  [functionNames.distance]: {
    label: 'distance(...)',
    component: CallDistanceEditor,
  },
  [functionNames.dateTimeDiff]: {
    label: 'dateTimeDiff(...)',
    component: CallDateTimeDiffEditor,
  },
  [functionNames.includes]: {
    label: 'includes(...)',
    component: CallIncludesEditor,
  },
  [functionNames.now]: {
    callee: functionNames.now,
  },
  [functionNames.categoryItemProp]: {
    label: 'categoryItemProp(...)',
    component: CallCategoryItemPropEditor,
  },
  [functionNames.taxonProp]: {
    label: 'taxonProp(...)',
    component: CallTaxonPropEditor,
  },
  [functionNames.taxonVernacularName]: {
    label: 'taxonVernacularName(...)',
    component: CallTaxonVernacularNameEditor,
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
  ...complexFunctions,
}

export const getComplexFunctionNameByExpression = (exprString) => {
  if (!exprString) return null
  return Object.keys(complexFunctions).find((key) => {
    const funcObj = complexFunctions[key]
    return funcObj.exprString === exprString
  })
}
