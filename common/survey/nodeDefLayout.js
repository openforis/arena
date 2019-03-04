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
  columns: 'layoutColumns', //int
  layout: 'layoutReactDataGrid', // rdg
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

const getDisplayIn = R.pipe(
  getPageUuid,
  R.ifElse(
    R.isNil,
    R.always(nodeDefDisplayIn.parentPage),
    R.always(nodeDefDisplayIn.ownPage)
  )
)

const getLayout = getProp(nodeDefLayoutProps.layout, [])

const hasPage = R.pipe(getPageUuid, R.isNil, R.not)
const filterInnerPageChildren = R.reject(hasPage)
const filterOuterPageChildren = R.filter(hasPage)

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
  getDisplayIn,
  filterInnerPageChildren,
  filterOuterPageChildren,
}