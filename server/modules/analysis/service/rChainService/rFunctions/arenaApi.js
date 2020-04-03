const toList = (object) => {
  const listValues = Object.entries(object)
    .map(([key, value]) => `${key} = ${value}`)
    .join(', ')

  return `list(${listValues})`
}

export const arenaGet = (url, params = {}) => `arena.get('${url}', query = ${toList(params)})`

export const arenaPost = (url, params = {}) => `arena.post('${url}', body = ${toList(params)})`

export const arenaDelete = (url, params = {}) => `arena.delete('${url}', body = ${toList(params)})`
