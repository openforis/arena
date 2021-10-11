import * as A from '@core/arena'

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

export const getSearch = () => String(_getUrlSearchParam({ param: 'search', defaultValue: '' }))

const getLink = ({ limit, offset, sort, search }) => {
  const url = new URL(window.location.href)

  if (limit > 0) url.searchParams.set('limit', String(limit))
  if (offset >= 0) url.searchParams.set('offset', String(offset))
  if (sort) {
    if (A.isEmpty(sort.order)) {
      url.searchParams.delete('sortBy')
      url.searchParams.delete('sortOrder')
    } else {
      url.searchParams.set('sortBy', String(sort.by))
      url.searchParams.set('sortOrder', String(sort.order))
    }
    url.searchParams.set('offset', String(0))
  }
  if (!A.isNull(search)) {
    if (A.isEmpty(search)) {
      url.searchParams.delete('search')
    } else {
      url.searchParams.set('search', String(search))
      url.searchParams.set('offset', String(0))
    }
  }
  return `${url.pathname}${url.search}`
}

export const updateQuery =
  (history) =>
  ({ key, value }) => {
    history.replace(getLink({ [key]: value }))
  }
