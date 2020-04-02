import * as R from 'ramda'

import * as ObjectUtils from '@core/objectUtils'

export const keys = {
  layout: 'layout',
  // Layout keys
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

export const newLayout = (cycle, renderType, pageUuid = null) =>
  R.pipe(
    R.assocPath([cycle, keys.renderType], renderType),
    R.when(R.always(pageUuid), R.assocPath([cycle, keys.pageUuid], pageUuid))
  )({})

// ====== READ

export const getLayout = ObjectUtils.getProp(keys.layout, {})

const _getPropLayout = (cycle, prop, defaultTo = null) => R.pipe(getLayout, R.pathOr(defaultTo, [cycle, prop]))

export const getRenderType = (cycle) => _getPropLayout(cycle, keys.renderType)

export const getLayoutChildren = (cycle) => _getPropLayout(cycle, keys.layoutChildren, [])

export const getColumnsNo = (cycle) => _getPropLayout(cycle, keys.columnsNo, 3)

export const getPageUuid = (cycle) => _getPropLayout(cycle, keys.pageUuid)

export const getDisplayIn = (cycle) =>
  R.ifElse(hasPage(cycle), R.always(displayIn.ownPage), R.always(displayIn.parentPage))

// ====== CHECK

export const hasPage = (cycle) => R.pipe(getPageUuid(cycle), R.isNil, R.not)

const isRenderType = (cycle, type) => R.pipe(getRenderType(cycle), R.equals(type))
export const isRenderTable = (cycle) => isRenderType(cycle, renderType.table)
export const isRenderForm = (cycle) => isRenderType(cycle, renderType.form)
export const isRenderDropdown = (cycle) => isRenderType(cycle, renderType.dropdown)
export const isRenderCheckbox = (cycle) => isRenderType(cycle, renderType.checkbox)

export const isDisplayInParentPage = (cycle) => R.pipe(getDisplayIn(cycle), R.propEq(displayIn.parentPage))

// ====== UPDATE
const _assocPropLayout = (cycle, prop, value) => R.assocPath([cycle, prop], value)

export const assocLayoutChildren = (cycle, layoutChildren) =>
  _assocPropLayout(cycle, keys.layoutChildren, layoutChildren)

// ====== UTILS

export const rejectNodeDefsWithPage = (cycle) => R.reject(hasPage(cycle))

export const filterNodeDefsWithPage = (cycle) => R.filter(hasPage(cycle))
