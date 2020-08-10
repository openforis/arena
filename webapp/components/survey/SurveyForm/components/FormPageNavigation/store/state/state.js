import * as A from '@core/arena'

import * as NodeDef from '@core/survey/nodeDef'

const keys = {
  nodeDef: 'nodeDef',
  rootNodeDef: 'rootNodeDef',
  edit: 'edit',
  parentNode: 'parentNode',
  childDefs: 'childDefs',
  level: 'level',
  label: 'label',
  active: 'active',
  isRoot: 'isRoot',
  enabled: 'enabled',
  showChildren: 'showChildren',
  expandedFormPageNavigation: 'expandedFormPageNavigation',
  canEditDef: 'canEditDef',
  surveyCycleKey: 'surveyCycleKey',
}

// ===== CREATE

export const create = ({
  nodeDef,
  rootNodeDef,
  edit,
  parentNode,
  childDefs,
  level,
  label,
  active,
  expandedFormPageNavigation,
  outerPageChildDefs,
  canEditDef,
  surveyCycleKey,
}) => ({
  [keys.nodeDef]: nodeDef,
  [keys.rootNodeDef]: rootNodeDef,
  [keys.edit]: edit,
  [keys.parentNode]: parentNode,
  [keys.childDefs]: childDefs,
  [keys.level]: level,
  [keys.label]: label,
  [keys.active]: active,
  [keys.outerPageChildDefs]: outerPageChildDefs,
  [keys.showChildren]: expandedFormPageNavigation || level === 0,
  [keys.enabled]:
    edit || NodeDef.isRoot(nodeDef) || NodeDef.getUuid(rootNodeDef) === NodeDef.getParentUuid(nodeDef) || parentNode,
  [keys.canEditDef]: canEditDef,
  [keys.surveyCycleKey]: surveyCycleKey,
})

// ===== READ

export const getNodeDef = A.prop(keys.nodeDef)
export const isEdit = A.prop(keys.edit)
export const getLevel = A.prop(keys.level)
export const getParentNode = A.prop(keys.parentNode)
export const getOuterPageChildDefs = A.prop(keys.outerPageChildDefs)
export const getExpandedFormPageNavigation = A.prop(keys.expandedFormPageNavigation)
export const getShowChildren = A.prop(keys.showChildren)
export const isActive = A.prop(keys.active)
export const getLabel = A.prop(keys.label)
export const canEditDef = A.prop(keys.canEditDef)
export const getSurveyCycleKey = A.prop(keys.surveyCycleKey)

export const isRoot = (state) => NodeDef.isRoot(getNodeDef(state))

export const isEnabled = A.prop(keys.enabled)

// ===== UPDATE

export const assocActive = (active) => A.assoc(keys.active, active)
export const assocShowChildren = (showChildren) => A.assoc(keys.showChildren, showChildren)
export const assocExpandedFormPageNavigation = (expandedFormPageNavigation) =>
  A.assoc(keys.expandedFormPageNavigation, expandedFormPageNavigation)
