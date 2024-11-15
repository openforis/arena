import * as Expression from '@core/expressionParser/expression'

import { CallCategoryItemPropEditor } from './callCategoryItemPropEditor'
import { CallCountEditor } from './callCountEditor'
import { CallIncludesEditor } from './callIncludesEditor'
import { CallIsEmptyEditor } from './callIsEmptyEditor'
import { CallIsNotEmptyEditor } from './callIsNotEmptyEditor'
import { CallTaxonPropEditor } from './callTaxonPropEditor'
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
  [functionNames.includes]: {
    label: 'includes(...)',
    component: CallIncludesEditor,
  },
  [functionNames.now]: {
    label: 'now()',
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
  [functionNames.userEmail]: {
    label: 'userEmail()',
    callee: functionNames.userEmail,
  },
  [functionNames.userName]: {
    label: 'userName()',
    callee: functionNames.userName,
  },
  [functionNames.userProp]: {
    label: 'userProp()',
    component: CallUserPropEditor,
  },
  [functionNames.uuid]: {
    label: 'uuid()',
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
