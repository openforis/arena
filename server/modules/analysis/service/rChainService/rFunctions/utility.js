export const NA = 'NA'

export const setVar = (name, value) => `${name} <- ${value}`

export const dfVar = (dataFrame, varName) => `${dataFrame}$${varName}`

export const merge = (x, y, by, allX = false) => `merge(x = ${x}, y = ${y}, by="${by}" ${allX ? ', all.x=TRUE' : ''})`

export const sysTime = () => `Sys.time()`

export const source = (path) => `source("${path}")`
