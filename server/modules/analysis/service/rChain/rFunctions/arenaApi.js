import { Objects } from '@openforis/arena-core'
import { quote } from '@core/stringUtils'
import { list } from './utility'

const toQueryArg = (params) => (Objects.isEmpty(params) ? null : `query = ${list(params)}`)
const toBodyArg = (params) => (Objects.isEmpty(params) ? null : `body = ${list(params)}`)

const arenaFunction = (funcName, ...args) => {
  const nonEmptyArgs = args.filter((arg) => !!arg)
  return `${funcName}(${nonEmptyArgs.join(', ')})`
}

export const arenaGet = (url, params = {}) => arenaFunction('arena.get', quote(url), toQueryArg(params))

export const arenaGetToFile = (url, params = {}, file) =>
  arenaFunction('arena.getToFile', quote(url), toQueryArg(params), `file = ${file}`)

export const arenaGetCSV = (url, params = {}) => arenaFunction('arena.getCSV', quote(url), toQueryArg(params))

export const arenaPost = (url, params = {}) => arenaFunction('arena.post', quote(url), toBodyArg(params))

export const arenaPut = (url, params = {}) => arenaFunction('arena.put', quote(url), toBodyArg(params))

export const arenaPutFile = (url, filePath, params = {}) =>
  arenaFunction('arena.putFile', quote(url), toBodyArg(params), `filePath = ${quote(filePath)}`)

export const arenaDelete = (url, params = {}) => arenaFunction('arena.delete', quote(url), toBodyArg(params))

export const arenaWaitForJobToComplete = (jobVarName) =>
  arenaFunction('arena.waitForJobToComplete', toBodyArg({ job: jobVarName }))
