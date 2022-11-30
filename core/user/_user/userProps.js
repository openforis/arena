import * as R from 'ramda'
import * as A from '@core/arena'
import * as ObjectUtils from '@core/objectUtils'

import { keys as userKeys } from './userKeys'

export const { mergeProps } = ObjectUtils

export const keysProps = {
  title: 'title',
  mapApiKeyByProvider: 'mapApiKeyByProvider',
}

export const titleKeys = ['mr', 'ms', 'preferNotToSay']

// ====== CREATE
export const newProps = ({ title = null, mapApiKeyByProvider = null }) => ({
  ...(!A.isEmpty(title) ? { title } : {}),
  ...(!A.isEmpty(mapApiKeyByProvider) ? { mapApiKeyByProvider } : {}),
})

// ====== READ
export const getProps = R.prop(userKeys.props)
export const getTitle = R.pipe(getProps, R.propOr('', keysProps.title))
export const getMapApiKey = ({ provider }) => R.pipe(getProps, R.path([keysProps.mapApiKeyByProvider, provider]))

// ====== UPDATE
export const assocProps = R.assoc(userKeys.props)
export const assocProp = (key) => (value) => (user) => assocProps(R.pipe(getProps, R.assoc(key, value))(user))(user)

export const assocTitle = assocProp(keysProps.title)
export const assocMapApiKey =
  ({ provider, apiKey }) =>
  (user) => {
    const mapApiKeyByProvider = R.pipe(getProps, R.prop(keysProps.mapApiKeyByProvider))(user)
    const mapApiKeyByProviderUpdated = { ...mapApiKeyByProvider, [provider]: apiKey }
    return assocProp(keysProps.mapApiKeyByProvider)(mapApiKeyByProviderUpdated)(user)
  }

export const dissocPrivateProps = R.dissocPath([userKeys.props, keysProps.mapApiKeyByProvider])
