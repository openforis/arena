const R = require('ramda')

const {entityDefRenderType} = require('./nodeDef')

const entityDefLayoutProps = {
  pageUUID: 'layoutPageUUID',
  render: 'layoutRender',
  columns: 'layoutColumns',
  layout: 'layoutReactDataGrid',
}

const getProp = (prop, defaultTo = null) => R.pipe(
  R.path(['props', prop]),
  R.defaultTo(defaultTo),
)

const isRenderType = type => R.pipe(
  getProp(entityDefLayoutProps.render),
  R.equals(type),
)

const isRenderTable = isRenderType(entityDefRenderType.table)
const isRenderForm = isRenderType(entityDefRenderType.form)

const getNoColumns = getProp(entityDefLayoutProps.columns, 3)
const getLayout = getProp(entityDefLayoutProps.layout, [])

module.exports = {
  entityDefLayoutProps,

  isRenderTable,
  isRenderForm,
  getNoColumns,
  getLayout,
}