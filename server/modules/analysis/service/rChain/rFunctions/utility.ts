// an R expression (code, variable name or literal)
export type RExpression = string | number

export const NA = 'NA'

export const comment = (text: RExpression) => `# ${text}`

export const tryCatch = ({
  code,
  ignoreErrors = false,
  errorFnName = 'saveError',
}: {
  code: string
  ignoreErrors?: boolean
  errorFnName?: string
}) => {
  // an ignored error is only printed: without a handler tryCatch rethrows it and arena.R stops
  const errorHandler = ignoreErrors ? 'function(e) print(e)' : errorFnName
  return `tryCatch(${code}, error=${errorHandler})`
}

export const source = (path: RExpression) => `source("${path}")`
export const sourceWithTryCatch = (path: RExpression, ignoreErrors: boolean = false) =>
  tryCatch({ code: source(path), ignoreErrors })

export const setVar = (name: string, value: RExpression) => `${name} <- ${value}`

export const dfVar = (dataFrame: RExpression, varName: RExpression) => `${dataFrame}$${varName}`

export const merge = (x: RExpression, y: RExpression, by: RExpression, allX = false) =>
  `merge(x = ${x}, y = ${y}, by="${by}" ${allX ? ', all.x=TRUE' : ''})`

export const vector = (values: RExpression[] = []) => `c(${values.join(', ')})`

export const list = (object: Record<string, RExpression>) => {
  const listValues = Object.entries(object)
    .map(([key, value]) => `${key} = ${value}`)
    .join(', ')
  return `list(${listValues})`
}

export const rm = (obj: RExpression) => `rm(${obj})`

export const sqldf = (query: RExpression) => `sqldf('${query}')`

// this is r with (reserved keyword)
export const withDF = (dfName: RExpression, body: RExpression) => `with(${dfName}, ${body})`

export const ifElse = (test: RExpression, yes: RExpression, no: RExpression) => `ifelse(${test}, ${yes}, ${no})`

export const isNa = (x: RExpression) => `is.na(${x})`

// == files and directories

export const unlink = (path: RExpression) => `unlink('${path}' , recursive = T)`

export const unlinkWd = `# unlink(getwd(), recursive = T)`

export const dirCreate = (path: RExpression) => `dir.create(path = '${path}', showWarnings = F, recursive = T)`

// == csv

export const writeCsv = (x: RExpression, file: RExpression, rowNames = 'F') =>
  `write.csv(${x}, file = '${file}', row.names = ${rowNames})`

// == converters

export const asCharacter = (value: RExpression) => `as.character(${value})`

export const asLogical = (value: RExpression) => `as.logical(${value})`

export const asNumeric = (value: RExpression, units = null) => {
  const unitsArg = units ? `, units='${units}'` : ''
  return `as.numeric(${value}${unitsArg})`
}

// == strings

export const paste = (parts: RExpression[], separator = ' ') => `paste(${parts.join(', ')}, sep='${separator}')`

export const paste0 = (parts: RExpression[]) => paste(parts, '')

// == system

export const sysTime = () => `Sys.time()`

export const q = () => `q()`

export const print = (value: RExpression) => `print( ${value} )`
