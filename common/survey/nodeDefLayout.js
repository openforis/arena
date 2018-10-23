const R = require('ramda')

const nodeDefRenderType = {
  // entity
  form: 'form',
  table: 'table',
  //codelist
  dropdown: 'dropdown',
  checkbox: 'checkbox',


  // only components render
  tableHeader: 'tableHeader',
  tableBody: 'tableBody',
}

const nodeDefLayoutPropertyName = 'props'
const nodeDefLayoutProps = {
  pageUUID: 'layoutPageUUID', // uuid
  render: 'layoutRender', // nodeDefRenderType
  columns: 'layoutColumns', //int
  layout: 'layoutReactDataGrid', // rdg
}

const getProp = (prop, defaultTo = null) => R.pipe(
  R.path([nodeDefLayoutPropertyName, prop]),
  R.defaultTo(defaultTo),
)

const isRenderType = type => R.pipe(
  getProp(nodeDefLayoutProps.render),
  R.equals(type),
)

const isRenderTable = isRenderType(nodeDefRenderType.table)
const isRenderForm = isRenderType(nodeDefRenderType.form)
const isRenderDropdown = isRenderType(nodeDefRenderType.dropdown)
const isRenderCheckbox = isRenderType(nodeDefRenderType.checkbox)

const getPageUUID = getProp(nodeDefLayoutProps.pageUUID)
const getNoColumns = R.pipe(
  getProp(nodeDefLayoutProps.columns, '3'),
  parseInt
)
const getLayout = getProp(nodeDefLayoutProps.layout, [])

const hasPage = R.pipe(getPageUUID, R.isNil, R.not)
const filterInnerPageChildren = R.reject(hasPage)
const filterOuterPageChildren = R.filter(hasPage)

module.exports = {
  nodeDefRenderType,
  nodeDefLayoutProps,

  isRenderTable,
  isRenderForm,
  isRenderDropdown,
  isRenderCheckbox,
  getNoColumns,
  getLayout,
  getPageUUID,

  filterInnerPageChildren,
  filterOuterPageChildren,
}