import * as R from 'ramda'

import * as ObjectUtils from '@core/objectUtils'

export const keys = {
  id: ObjectUtils.keys.id,
  props: ObjectUtils.keys.props,
  resolved: 'resolved',
  nodeDefUuid: ObjectUtils.keys.nodeDefUuid,
}

export const propKeys = {
  itemType: 'itemType',
  expression: 'expression',
  message: 'message',
}

// Mirrors collectImportReportItem.js's exprTypes, extended with ODK-specific cases (no `codeParent`
// here - see the design spec's choice_filter scope decision) - see
// docs/superpowers/specs/2026-09-09-odk-import-design.md.
export const itemTypes = {
  relevant: 'relevant', // -> Arena applicable expression
  constraint: 'constraint', // -> Arena validation rule expression
  calculate: 'calculate', // -> Arena default value expression
  requiredExpr: 'requiredExpr', // ODK's `required` can itself be an XPath expression, not just true/false
  unmappedType: 'unmappedType', // xformTypeMapping.ts flagged this ODK bind type as having no clean Arena equivalent
  lossyGeoConversion: 'lossyGeoConversion', // geotrace/geoshape -> geo (GeoJSON) is a genuine but lossy mapping
  skippedNote: 'skippedNote', // a readonly, body-control-less ODK "note" - no NodeDef was created for it
  choiceFilterNotConverted: 'choiceFilterNotConverted', // a choice_filter was imported as a flat, non-cascading category
  missingCategory: 'missingCategory', // a select1/select attribute's choice list couldn't be resolved to a Category
  missingEntityKey: 'missingEntityKey', // no eligible attribute was found to default an entity's key to
}

export const newReportItem = ({
  nodeDefUuid,
  itemType,
  expression = null,
  message = null,
  resolved = false,
}: {
  nodeDefUuid: string
  itemType: string
  expression?: string | null
  message?: string | null
  resolved?: boolean
}) => ({
  [keys.nodeDefUuid]: nodeDefUuid,
  [keys.props]: {
    [propKeys.itemType]: itemType,
    [propKeys.expression]: expression,
    [propKeys.message]: message,
  },
  [keys.resolved]: resolved,
})

export const { getId } = ObjectUtils
export const isResolved = R.propOr(false, keys.resolved)
export const getNodeDefUuid = R.prop(keys.nodeDefUuid)
export const getProps = R.propOr({}, keys.props)

export const getItemType = ObjectUtils.getProp(propKeys.itemType)
export const getExpression = ObjectUtils.getProp(propKeys.expression, '')
export const getMessage = ObjectUtils.getProp(propKeys.message, '')
