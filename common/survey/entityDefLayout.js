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

const getPageUUID = getProp(entityDefLayoutProps.pageUUID)
const getNoColumns = getProp(entityDefLayoutProps.columns, 3)
const getLayout = getProp(entityDefLayoutProps.layout, [])

const hasPage = R.pipe(getPageUUID, R.isNil, R.not)
const filterInnerPageChildren = R.reject(hasPage)
const filterOuterPageChildren = R.filter(hasPage)

module.exports = {
  entityDefLayoutProps,

  isRenderTable,
  isRenderForm,
  getNoColumns,
  getLayout,

  filterInnerPageChildren,
  filterOuterPageChildren,
}