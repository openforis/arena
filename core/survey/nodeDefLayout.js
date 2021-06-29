import * as R from 'ramda'

import * as ObjectUtils from '@core/objectUtils'

export const keys = {
  layout: 'layout',
  // Layout keys
  indexChildren: 'indexChildren',
  pageUuid: 'pageUuid', // Page uuid
  renderType: 'renderType', // RenderType
  columnsNo: 'columnsNo', // Number of columns
  layoutChildren: 'layoutChildren', // React Data Grid layout (form layout) or sorted children uuids (table layout)
}

export const renderType = {
  // Entity
  form: 'form',
  table: 'table',
  // Code
  dropdown: 'dropdown',
  checkbox: 'checkbox',

  // Only components render
  tableHeader: 'tableHeader',
  tableBody: 'tableBody',
}

export const displayIn = {
  parentPage: 'parentPage',
  ownPage: 'ownPage',
}

// ====== CREATE

export const newLayout = (cycle, renderAs, pageUuid = null) =>
  R.pipe(
    R.assocPath([cycle, keys.renderType], renderAs),
    R.when(R.always(pageUuid), R.assocPath([cycle, keys.pageUuid], pageUuid))
  )({})

// ====== READ

export const getLayout = ObjectUtils.getProp(keys.layout, {})

export const getLayoutCycle = (cycle) => R.pipe(getLayout, R.prop(cycle))

const _getPropLayout = (cycle, prop, defaultTo = null) => R.pipe(getLayoutCycle(cycle), R.propOr(defaultTo, prop))

export const getIndexChildren = (cycle) => _getPropLayout(cycle, keys.indexChildren)

export const getRenderType = (cycle) => _getPropLayout(cycle, keys.renderType)

export const getLayoutChildren = (cycle) => _getPropLayout(cycle, keys.layoutChildren, [])

/**
 * Returns the uuids of the layout children items.
 * If the render type is form, they will be ordered from top to bottom according to the grid layout props (y and x),
 * othwerwise they will be in the order they are defined in the 'layoutChildren' prop.
 *
 * @param {!string} cycle - The survey cycle key.
 * @returns {Array} - Array of child item uuids, ordered from top to bottom.
 */
export const getLayoutChildrenUuids = (cycle) => (nodeDef) => {
  const nodeDefRenderType = getRenderType(cycle)(nodeDef)
  const layoutChildren = getLayoutChildren(cycle)(nodeDef)
  return nodeDefRenderType === renderType.table
    ? layoutChildren
    : R.pipe(R.sortWith([R.ascend(R.prop('y')), R.ascend(R.prop('x'))]), R.map(R.prop('i')))(layoutChildren)
}

export const getColumnsNo = (cycle) => _getPropLayout(cycle, keys.columnsNo, 3)

export const getPageUuid = (cycle) => _getPropLayout(cycle, keys.pageUuid)

export const hasPage = (cycle) => R.pipe(getPageUuid(cycle), R.isNil, R.not)

export const getDisplayIn = (cycle) =>
  R.ifElse(hasPage(cycle), R.always(displayIn.ownPage), R.always(displayIn.parentPage))

const isRenderType = (cycle, type) => R.pipe(getRenderType(cycle), R.equals(type))
export const isRenderTable = (cycle) => isRenderType(cycle, renderType.table)
export const isRenderForm = (cycle) => isRenderType(cycle, renderType.form)
export const isRenderDropdown = (cycle) => isRenderType(cycle, renderType.dropdown)
export const isRenderCheckbox = (cycle) => isRenderType(cycle, renderType.checkbox)

const isDisplayIn = (cycle, value) => R.pipe(getDisplayIn(cycle), R.equals(value))
export const isDisplayInParentPage = (cycle) => isDisplayIn(cycle, displayIn.parentPage)
export const isDisplayInOwnPage = (cycle) => isDisplayIn(cycle, displayIn.ownPage)

// ====== UPDATE
export const assocLayout = (layout) => ObjectUtils.setProp(keys.layout, layout)

export const assocLayoutCycle = (cycle, layoutCycle) => R.assoc(cycle, layoutCycle)

export const assocLayoutProp = (cycle, prop, value) => R.assocPath([cycle, prop], value)

export const assocIndexChildren = (cycle, indexChildren) => assocLayoutProp(cycle, keys.indexChildren, indexChildren)

export const assocLayoutChildren = (cycle, layoutChildren) =>
  assocLayoutProp(cycle, keys.layoutChildren, layoutChildren)

export const dissocLayoutChildren = (cycle) => R.dissocPath([cycle, keys.layoutChildren])

export const assocPageUuid = (cycle, pageUuid) => assocLayoutProp(cycle, keys.pageUuid, pageUuid)

export const copyLayout =
  ({ cycleFrom, cyclesTo }) =>
  (nodeDef) => {
    const layoutCycle = getLayoutCycle(cycleFrom)(nodeDef)
    const layoutUpdated = cyclesTo
      .filter((cycleKey) => cycleKey !== cycleFrom)
      .reduce((layoutAcc, cycleKey) => assocLayoutCycle(cycleKey, layoutCycle)(layoutAcc), getLayout(nodeDef))
    return assocLayout(layoutUpdated)(nodeDef)
  }

// ====== UTILS

export const rejectNodeDefsWithPage = (cycle) => R.reject(hasPage(cycle))

export const filterNodeDefsWithPage = (cycle) => R.filter(hasPage(cycle))
