const _getUrlSearchParam = ({ param, defaultValue = null }) => {
  const url = new URL(window.location.href)
  return url.searchParams.get(param) || defaultValue
}

export const getLimit = () => Number(_getUrlSearchParam({ param: 'limit', defaultValue: 15 }))

export const getOffset = () => Number(_getUrlSearchParam({ param: 'offset' }))

export const getLink = ({ limit, offset }) => {
  const url = new URL(window.location.href)
  url.searchParams.set('limit', String(limit))
  url.searchParams.set('offset', String(offset))
  return `${url.pathname}${url.search}`
}
