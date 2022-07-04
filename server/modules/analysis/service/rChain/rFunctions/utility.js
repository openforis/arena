export const NA = 'NA'

export const comment = (text) => `# ${text}`

export const tryCatch = ({ code, errorFnName = 'saveError' }) => `tryCatch(${code},error=${errorFnName})`

export const source = (path) => `source("${path}")`
export const sourceWithTryCatch = (path) => tryCatch({ code: source(path) })

export const setVar = (name, value) => `${name} <- ${value}`

export const dfVar = (dataFrame, varName) => `${dataFrame}$${varName}`

export const merge = (x, y, by, allX = false) => `merge(x = ${x}, y = ${y}, by="${by}" ${allX ? ', all.x=TRUE' : ''})`

export const vector = (values = []) => `c(${values.join(', ')})`

export const list = (object) => {
  const listValues = Object.entries(object)
    .map(([key, value]) => `${key} = ${value}`)
    .join(', ')
  return `list(${listValues})`
}

export const rm = (obj) => `rm(${obj})`

export const sqldf = (query) => `sqldf('${query}')`

// this is r with (reserved keyword)
export const withDF = (dfName, body) => `with(${dfName}, ${body})`

export const ifElse = (test, yes, no) => `ifelse(${test}, ${yes}, ${no})`

export const isNa = (x) => `is.na(${x})`

// == files and directories

export const unlink = (path) => `unlink('${path}' , recursive = T)`

export const unlinkWd = `# unlink(getwd(), recursive = T)`

export const dirCreate = (path) => `dir.create(path = '${path}', showWarnings = F, recursive = T)`

// == csv

export const writeCsv = (x, file, rowNames = 'F') => `write.csv(${x}, file = '${file}', row.names = ${rowNames})`

// == converters

export const asCharacter = (value) => `as.character(${value})`

export const asLogical = (value) => `as.logical(${value})`

export const asNumeric = (value, units = null) => `as.numeric(${value}${units ? `, units='${units}'` : ''})`

// == strings

export const paste = (parts, separator = ' ') => `paste(${parts.join(', ')}, sep='${separator}')`

export const paste0 = (parts) => paste(parts, '')

// == system

export const sysTime = () => `Sys.time()`

export const q = () => `q()`
