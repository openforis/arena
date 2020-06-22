import { Query } from '@common/model/query'

const keyStorage = 'data-explorer'

export const getQuery = () => {
  const query = window.sessionStorage.getItem(keyStorage)
  if (query) {
    return JSON.parse(query)
  }

  return Query.create()
}

export const setQuery = (query) => window.sessionStorage.setItem(keyStorage, JSON.stringify(query))
