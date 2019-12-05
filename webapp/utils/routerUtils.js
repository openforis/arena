import * as R from 'ramda'

export const getLocationPathname = R.path(['location', 'pathname'])

export const getUrlParam = param => R.path(['params', param])
