const keys = {
  query: 'explorer-query',
}

export const getQuery = () => {
  const query = window.localStorage.getItem(keys.query)
  return query ? JSON.parse(query) : null
}

export const persistQuery = (query) => window.localStorage.setItem(keys.query, JSON.stringify(query))

export const removeQuery = () => window.localStorage.removeItem(keys.query)
