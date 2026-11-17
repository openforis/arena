export const NA = 'NA'

export const comment = (text: any) => `# ${text}`

export const tryCatch = ({
  code,
  ignoreErrors = false,
  errorFnName = 'saveError',
}: {
  code: string
  ignoreErrors?: boolean
  errorFnName?: any
}) => {
  const tryCatchArguments = [code]
  if (!ignoreErrors) {
    tryCatchArguments.push(`error=${errorFnName}`)
  }
  return `tryCatch(${tryCatchArguments.join(', ')})`
}

export const source = (path: any) => `source("${path}")`
export const sourceWithTryCatch = (path: any, ignoreErrors: boolean = false) =>
  tryCatch({ code: source(path), ignoreErrors })

export const setVar = (name: string, value: unknown) => `${name} <- ${value}`

export const dfVar = (dataFrame: any, varName: any) => `${dataFrame}$${varName}`

export const merge = (x: any, y: any, by: any, allX = false) =>
  `merge(x = ${x}, y = ${y}, by="${by}" ${allX ? ', all.x=TRUE' : ''})`

export const vector = (values = []) => `c(${values.join(', ')})`

export const list = (object: any) => {
  const listValues = Object.entries(object)
    .map(([key, value]) => `${key} = ${value}`)
    .join(', ')
  return `list(${listValues})`
}

export const rm = (obj: any) => `rm(${obj})`

export const sqldf = (query: any) => `sqldf('${query}')`

// this is r with (reserved keyword)
export const withDF = (dfName: any, body: any) => `with(${dfName}, ${body})`

export const ifElse = (test: any, yes: any, no: any) => `ifelse(${test}, ${yes}, ${no})`

export const isNa = (x: any) => `is.na(${x})`

// == files and directories

export const unlink = (path: any) => `unlink('${path}' , recursive = T)`

export const unlinkWd = `# unlink(getwd(), recursive = T)`

export const dirCreate = (path: any) => `dir.create(path = '${path}', showWarnings = F, recursive = T)`

// == csv

export const writeCsv = (x: any, file: any, rowNames = 'F') =>
  `write.csv(${x}, file = '${file}', row.names = ${rowNames})`

// == converters

export const asCharacter = (value: unknown) => `as.character(${value})`

export const asLogical = (value: unknown) => `as.logical(${value})`

export const asNumeric = (value: unknown, units = null) => {
  const unitsArg = units ? `, units='${units}'` : ''
  return `as.numeric(${value}${unitsArg})`
}

// == strings

export const paste = (parts: any, separator = ' ') => `paste(${parts.join(', ')}, sep='${separator}')`

export const paste0 = (parts: any) => paste(parts, '')

// == system

export const sysTime = () => `Sys.time()`

export const q = () => `q()`

export const print = (value: unknown) => `print( ${value} )`
