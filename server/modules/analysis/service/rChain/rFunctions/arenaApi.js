import { Objects } from '@openforis/arena-core'
import { quote } from '@core/stringUtils'
import { list } from './utility'

const getQueryParam = (params) => (Objects.isEmpty(params) ? null : `query = ${list(params)}`)
const getBodyParam = (params) => (Objects.isEmpty(params) ? null : `body = ${list(params)}`)

const getArenaFunction = (funcName, ...args) => {
  const nonEmptyArgs = args.filter((arg) => !!arg)
  return `${funcName}(${nonEmptyArgs.join(', ')})`
}

export const arenaGet = (url, params = {}) => getArenaFunction('arena.get', quote(url), getQueryParam(params))

export const arenaGetToFile = (url, params = {}, file) =>
  getArenaFunction('arena.getToFile', quote(url), getQueryParam(params), `file = ${file}`)

export const arenaGetCSV = (url, params = {}) => getArenaFunction('arena.getCSV', quote(url), getQueryParam(params))

export const arenaPost = (url, params = {}) => getArenaFunction('arena.post', quote(url), getBodyParam(params))

export const arenaPut = (url, params = {}) => getArenaFunction('arena.put', quote(url), getBodyParam(params))

export const arenaPutFile = (url, filePath, params = {}) =>
  getArenaFunction('arena.putFile', quote(url), getBodyParam(params), `filePath = ${quote(filePath)}`)

export const arenaDelete = (url, params = {}) => getArenaFunction('arena.delete', quote(url), getBodyParam(params))
