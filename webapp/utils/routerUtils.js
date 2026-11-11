import * as A from '@core/arena'

export const getLocationPathname = A.path(['location', 'pathname'])

export const getUrlParam = (param) => A.path(['params', param])
