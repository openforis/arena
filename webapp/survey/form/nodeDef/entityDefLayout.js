import * as R from 'ramda'

import { entityDefRenderType } from '../../../../common/survey/nodeDef'

const layoutProps = {
  render: 'render',
  columns: 'columns'
}

export const getLayout = R.pipe(
  R.path(['props', 'layout']),
  R.defaultTo({}),
)

const getLayoutProp = (prop, defaultTo = null) => R.pipe(
  getLayout,
  R.prop(prop),
  R.defaultTo(defaultTo),
)

const isRenderType = type => R.pipe(
  getLayoutProp(layoutProps.render),
  R.equals(type),
)

export const isRenderTable = isRenderType(entityDefRenderType.table)
export const isRenderForm = isRenderType(entityDefRenderType.form)

export const getNoColumns = getLayoutProp(layoutProps.columns, 3)
