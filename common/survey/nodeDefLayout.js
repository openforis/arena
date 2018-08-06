const R = require('ramda')

const nodeDefRenderType = {
  form: 'form',
  table: 'table',
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
  getNoColumns,
  getLayout,

  filterInnerPageChildren,
  filterOuterPageChildren,
}