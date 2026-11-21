import { Objects } from '@openforis/arena-core'
import { quote } from '@core/stringUtils'
import { list, type RExpression } from './utility'

const toQueryArg = (params: Record<string, RExpression>) => (Objects.isEmpty(params) ? null : `query = ${list(params)}`)
const toBodyArg = (params: Record<string, RExpression>) => (Objects.isEmpty(params) ? null : `body = ${list(params)}`)

const arenaFunction = (funcName: string, ...args: (RExpression | null)[]) => {
  const nonEmptyArgs = args.filter((arg) => !!arg)
  return `${funcName}(${nonEmptyArgs.join(', ')})`
}

export const arenaGet = (url: string, params = {}) => arenaFunction('arena.get', quote(url), toQueryArg(params))

export const arenaGetToFile = (url: string, file: string, params = {}) =>
  arenaFunction('arena.getToFile', quote(url), toQueryArg(params), `file = ${file}`)

export const arenaGetCSV = (url: string, params = {}) => arenaFunction('arena.getCSV', quote(url), toQueryArg(params))

export const arenaPost = (url: string, params = {}) => arenaFunction('arena.post', quote(url), toBodyArg(params))

export const arenaPut = (url: string, params = {}) => arenaFunction('arena.put', quote(url), toBodyArg(params))

export const arenaPutFile = (url: string, filePath: string, params = {}) =>
  arenaFunction('arena.putFile', quote(url), toBodyArg(params), `filePath = ${quote(filePath)}`)

export const arenaDelete = (url: string, params = {}) => arenaFunction('arena.delete', quote(url), toBodyArg(params))

export const arenaWaitForJobToComplete = (jobVarName: string) => arenaFunction('arena.waitForJobToComplete', jobVarName)
