import * as A from '@core/arena'

const _getUrlSearchParam = ({ param, defaultValue = null }) => {
  const url = new URL(window.location.href)
  return url.searchParams.get(param) || defaultValue
}

export const getLimit = () => Number(_getUrlSearchParam({ param: 'limit', defaultValue: 30 }))

export const getOffset = () => Number(_getUrlSearchParam({ param: 'offset' }))

export const getSort = () => ({
  by: _getUrlSearchParam({ param: 'sortBy' }),
  order: _getUrlSearchParam({ param: 'sortOrder' }),
})

export const getSearch = () => String(_getUrlSearchParam({ param: 'search', defaultValue: '' }))

const _setOrDeleteParams = ({ searchParams, params }) => {
  Object.entries(params).forEach(([key, value]) => {
    if (A.isEmpty(value)) {
      searchParams.delete(key)
    } else {
      searchParams.set(key, String(value))
    }
  })
}

const getLink = ({ limit, offset, sort, search }) => {
  const url = new URL(window.location.href)
  const { searchParams } = url

  // limit
  if (limit > 0) _setOrDeleteParams({ searchParams, params: { limit } })

  // offset
  if (offset !== undefined) {
    const offsetNew = offset > 0 ? offset : null
    _setOrDeleteParams({ searchParams, params: { offset: offsetNew } })
  }

  // sort
  if (sort) {
    const { by: sortBy, order: sortOrder } = sort
    _setOrDeleteParams({ searchParams, params: { sortBy: sortOrder ? sortBy : null, sortOrder } })
  }

  // search
  if (search !== undefined) {
    _setOrDeleteParams({ searchParams, params: { search } })
  }

  return `${url.pathname}${url.search}`
}

export const updateQuery = (navigate) => (params) => {
  navigate(getLink(params), { replace: true })
}
