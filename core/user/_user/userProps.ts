import * as R from 'ramda'

import * as A from '@core/arena'
import * as ObjectUtils from '@core/objectUtils'

import { keys as userKeys } from './userKeys'

const defaultMaxSurveys = 5

export const { mergeProps } = ObjectUtils

export const keysProps = {
  title: 'title',
  // private props (visible only to the user itself)
  mapApiKeyByProvider: 'mapApiKeyByProvider',
  // restricted props (editable only by system admins)
  maxSurveys: 'maxSurveys',
  // custom extra properties
  extra: ObjectUtils.keysProps.extra,
} as const

const privateProps = [keysProps.mapApiKeyByProvider]
const restrictedProps = [keysProps.maxSurveys]

export const titleKeys = {
  mr: 'mr',
  ms: 'ms',
  preferNotToSay: 'preferNotToSay',
} as const
export const titleKeysArray = Object.keys(titleKeys)

// ====== CREATE
export const newProps = (propsParam: Record<string, unknown>) =>
  Object.keys(keysProps).reduce<Record<string, unknown>>((acc, propKey) => {
    const propValue = propsParam[propKey]
    if (!A.isEmpty(propValue)) {
      acc[propKey] = propValue
    }
    return acc
  }, {})

// ====== READ
export const getProps = R.prop(userKeys.props)
export const getTitle = R.pipe(getProps, R.propOr('', keysProps.title))
export const getMapApiKey = ({ provider }: { provider: string }) =>
  R.pipe(getProps, R.path([keysProps.mapApiKeyByProvider, provider]))
export const getMaxSurveys = R.pipe(getProps, R.propOr(defaultMaxSurveys, keysProps.maxSurveys))

// ====== UPDATE
export const assocProps = R.assoc(userKeys.props)
export const assocProp = (key: string) => (value: unknown) => (user: Record<string, unknown>) =>
  assocProps(R.pipe(getProps, R.assoc(key, value))(user))(user)
export const assocTitle = assocProp(keysProps.title)
export const assocMapApiKey =
  ({ provider, apiKey }: { provider: string; apiKey: string }) =>
  (user: Record<string, unknown>) => {
    const mapApiKeyByProvider = R.pipe(getProps, R.prop(keysProps.mapApiKeyByProvider))(user)
    const mapApiKeyByProviderUpdated = { ...(mapApiKeyByProvider as object), [provider]: apiKey }
    return assocProp(keysProps.mapApiKeyByProvider)(mapApiKeyByProviderUpdated)(user)
  }
export const assocMaxSurveys = assocProp(keysProps.maxSurveys)
export const assocExtra = assocProp(keysProps.extra)

const dissocListOfProps = (propsArray: string[]) => (user: Record<string, unknown>) =>
  propsArray.reduce((acc, propKey) => R.dissocPath([userKeys.props, propKey])(acc), user)

export const dissocPrivateProps = dissocListOfProps(privateProps)
export const dissocRestrictedProps = dissocListOfProps(restrictedProps)
