import * as R from 'ramda'
import * as ObjectUtils from '@core/objectUtils'

import { keys as userKeys } from './userKeys'

export const { mergeProps } = ObjectUtils

export const keysProps = {
  title: 'title',
}

// ====== READ
export const getProps = R.prop(userKeys.props)
export const getTitle = R.pipe(getProps, R.propOr('', keysProps.title))

// ====== UPDATE
export const assocProps = R.assoc(userKeys.props)
export const assocProp = (key) => (value) => (user) => assocProps(R.pipe(getProps, R.assoc(key, value))(user))(user)

export const assocTitle = assocProp(keysProps.title)
