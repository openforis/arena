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

const getRenderType = ObjectUtils.getProp(nodeDefLayoutProps.render)

const isRenderType = type => R.pipe(
  getRenderType,
  R.equals(type),
)

const isRenderTable = isRenderType(renderType.table)
const isRenderForm = isRenderType(renderType.form)
const isRenderDropdown = isRenderType(renderType.dropdown)
const isRenderCheckbox = isRenderType(renderType.checkbox)

const getPageUuid = ObjectUtils.getProp(nodeDefLayoutProps.pageUuid)

const getNoColumns = R.pipe(
  ObjectUtils.getProp(nodeDefLayoutProps.columns, '3'),
  parseInt
)

const getLayout = ObjectUtils.getProp(nodeDefLayoutProps.layout, [])

const hasPage = R.pipe(getPageUuid, R.isNil, R.not)
const filterInnerPageChildren = R.reject(hasPage)
const filterOuterPageChildren = R.filter(hasPage)

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

  nodeDefLayoutProps,
  nodeDefDisplayIn,

  isRenderTable,
  isRenderForm,
  isRenderDropdown,
  isRenderCheckbox,
  getRenderType,
  getNoColumns,
  getLayout,
  getPageUuid,
  hasPage,
  getDisplayIn,
  isDisplayInParentPage,
  filterInnerPageChildren,
  filterOuterPageChildren,
}