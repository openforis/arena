const prefix = 'res_'

export const getViewNamesPrefix = chainUuid => `${prefix}${chainUuid}`

export const getViewName = (chainUuid, stepUuid) => `${getViewNamesPrefix(chainUuid)}_${stepUuid}`
