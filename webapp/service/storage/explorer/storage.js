import * as A from '@core/arena'

const keys = {
  query: 'explorer-query',
}

export const getQuery = () => {
  const query = window.localStorage.getItem(keys.query)
  return query ? A.parse(query) : null
}

export const persistQuery = (query) => window.localStorage.setItem(keys.query, A.stringify(query))

export const removeQuery = () => window.localStorage.removeItem(keys.query)
