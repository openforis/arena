const _getUrlSearchParam = ({ param, defaultValue = null }) => {
  const url = new URL(window.location.href)
  return url.searchParams.get(param) || defaultValue
}

export const getLimit = () => Number(_getUrlSearchParam({ param: 'limit', defaultValue: 15 }))

export const getOffset = () => Number(_getUrlSearchParam({ param: 'offset' }))

export const getSort = () => ({
  by: _getUrlSearchParam({ param: 'sortBy' }),
  order: _getUrlSearchParam({ param: 'sortOrder' }),
})

export const getLink = ({ limit, offset, sort }) => {
  const url = new URL(window.location.href)

  if (limit) url.searchParams.set('limit', String(limit))
  if (offset) url.searchParams.set('offset', String(offset))
  if (sort) {
    url.searchParams.set('sortBy', String(sort.by))
    url.searchParams.set('sortOrder', String(sort.order))
    url.searchParams.set('offset', String(0))
  }
  return `${url.pathname}${url.search}`
}

export const updateQuery =
  (history) =>
  ({ key, value }) => {
    history.replace(getLink({ [key]: value }))
  }
