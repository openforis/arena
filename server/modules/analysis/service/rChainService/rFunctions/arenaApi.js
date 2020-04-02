export const arenaGet = (url) => `arena.get('${url}')`

export const arenaPost = (url, params) =>
  `arena.post(
        '${url}', 
        body = list(${Object.entries(params)
          .map(([key, value]) => `${key}='${value}'`)
          .join(', ')})
    )`
