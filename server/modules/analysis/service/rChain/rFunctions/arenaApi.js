import { list } from './utility'

export const arenaGet = (url, params = {}) => `arena.get('${url}', query = ${list(params)})`

export const arenaGetToFile = (url, params = {}, file) =>
  `arena.getToFile('${url}', query = ${list(params)}, file = ${file})`

export const arenaGetCSV = (url, params = {}) => `arena.getCSV('${url}', query = ${list(params)})`

export const arenaPost = (url, params = {}) => `arena.post('${url}', body = ${list(params)})`

export const arenaPut = (url, params = {}) => `arena.put('${url}', body = ${list(params)})`

export const arenaPutFile = (url, filePath) => `arena.putFile('${url}', filePath = '${filePath}')`

export const arenaDelete = (url, params = {}) => `arena.delete('${url}', body = ${list(params)})`
