const R = require('ramda')

const ObjectUtils = require('../../common/objectUtils')

const NodeDef = require('./nodeDef')

const keys = {
  layout: 'layout',
  // layout keys
  pageUuid: 'pageUuid', // page uuid
  renderType: 'renderType', // renderType
  columnsNo: 'columnsNo', // number of columns
  layoutChildren: 'layoutChildren', // React Data Grid layout (form layout) or sorted children uuids (table layout)
}

const renderType = {
  // entity
  form: 'form',
  table: 'table',
  // code
  dropdown: 'dropdown',
  checkbox: 'checkbox',

  // only components render
  tableHeader: 'tableHeader',
  tableBody: 'tableBody',
}

// ====== CREATE

const newLayout = (cycle, renderType, pageUuid = null) => ({
  [cycle]: {
    [keys.renderType]: renderType,
    [keys.pageUuid]: pageUuid,
  }
})

// ====== READ

const _getPropLayout = (cycle, prop, defaultTo = null) => R.pipe(
  NodeDef.getProps,
  R.pathOr(defaultTo, [keys.layout, cycle, prop])
)

const getRenderType = cycle => _getPropLayout(cycle, keys.renderType)

const getLayoutChildren = cycle => _getPropLayout(cycle, keys.layoutChildren, [])

const getColumnsNo = cycle => _getPropLayout(cycle, keys.columnsNo, 3)

const getPageUuid = cycle => _getPropLayout(cycle, keys.pageUuid)

// ====== CHECK

const hasPage = cycle => R.pipe(getPageUuid(cycle), R.isNil, R.not)

// ====== UTILS

const rejectNodeDefsWithPage = cycle => R.reject(hasPage(cycle))

const filterNodeDefsWithPage = cycle => R.filter(hasPage(cycle))

//========================================= OLD
const nodeDefLayoutProps = {
  pageUuid: 'layoutPageUuid', // uuid
  render: 'layoutRender', // nodeDefRenderType
  columns: 'layoutColumns', // number of columns
  layout: 'layout', // React Data Grid layout (form layout) or sorted children uuids (table layout)
}

const nodeDefDisplayIn = {
  parentPage: 'parentPage',
  ownPage: 'ownPage',
}

const isRenderType = type => R.pipe(
  getRenderType,
  R.equals(type),
)

const isRenderTable = isRenderType(renderType.table)
const isRenderForm = isRenderType(renderType.form)
const isRenderDropdown = isRenderType(renderType.dropdown)
const isRenderCheckbox = isRenderType(renderType.checkbox)

const getDisplayIn = R.ifElse(
  hasPage,
  R.always(nodeDefDisplayIn.ownPage),
  R.always(nodeDefDisplayIn.parentPage)
)

const isDisplayInParentPage = R.pipe(
  getDisplayIn,
  R.propEq(nodeDefDisplayIn.parentPage)
)

module.exports = {
  keys,
  renderType,

  //CREATE
  newLayout,

  //READ
  getRenderType,
  getLayoutChildren,
  getColumnsNo,
  getPageUuid,

  //CHECK
  hasPage,

  //UTILS
  rejectNodeDefsWithPage,
  filterNodeDefsWithPage,

  // ==== OLD

  nodeDefLayoutProps,
  nodeDefDisplayIn,

  isRenderTable,
  isRenderForm,
  isRenderDropdown,
  isRenderCheckbox,
  getDisplayIn,
  isDisplayInParentPage,
}