const R = require('ramda')

const nodeDefRenderType = {
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

const nodeDefLayoutPropertyName = 'props'
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

const getProp = (prop, defaultTo = null) => R.pipe(
  R.path([nodeDefLayoutPropertyName, prop]),
  R.defaultTo(defaultTo),
)

const getRenderType = getProp(nodeDefLayoutProps.render)

const isRenderType = type => R.pipe(
  getRenderType,
  R.equals(type),
)

const isRenderTable = isRenderType(nodeDefRenderType.table)
const isRenderForm = isRenderType(nodeDefRenderType.form)
const isRenderDropdown = isRenderType(nodeDefRenderType.dropdown)
const isRenderCheckbox = isRenderType(nodeDefRenderType.checkbox)

const getPageUuid = getProp(nodeDefLayoutProps.pageUuid)

const getNoColumns = R.pipe(
  getProp(nodeDefLayoutProps.columns, '3'),
  parseInt
)

const getLayout = getProp(nodeDefLayoutProps.layout, [])

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
  nodeDefRenderType,
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