import { Objects } from '@openforis/arena-core'
import { quote } from '@core/stringUtils'
import { list } from './utility'

const toQueryArg = (params: any) => (Objects.isEmpty(params) ? null : `query = ${list(params)}`)
const toBodyArg = (params: any) => (Objects.isEmpty(params) ? null : `body = ${list(params)}`)

const arenaFunction = (funcName: any, ...args: any[]) => {
  const nonEmptyArgs = args.filter((arg) => !!arg)
  return `${funcName}(${nonEmptyArgs.join(', ')})`
}

export const arenaGet = (url: any, params = {}) => arenaFunction('arena.get', quote(url), toQueryArg(params))

export const arenaGetToFile = (url: any, file: any, params = {}) =>
  arenaFunction('arena.getToFile', quote(url), toQueryArg(params), `file = ${file}`)

export const arenaGetCSV = (url: any, params = {}) => arenaFunction('arena.getCSV', quote(url), toQueryArg(params))

export const arenaPost = (url: any, params = {}) => arenaFunction('arena.post', quote(url), toBodyArg(params))

export const arenaPut = (url: any, params = {}) => arenaFunction('arena.put', quote(url), toBodyArg(params))

export const arenaPutFile = (url: any, filePath: string, params = {}) =>
  arenaFunction('arena.putFile', quote(url), toBodyArg(params), `filePath = ${quote(filePath)}`)

export const arenaDelete = (url: any, params = {}) => arenaFunction('arena.delete', quote(url), toBodyArg(params))

export const arenaWaitForJobToComplete = (jobVarName: any) => arenaFunction('arena.waitForJobToComplete', jobVarName)
