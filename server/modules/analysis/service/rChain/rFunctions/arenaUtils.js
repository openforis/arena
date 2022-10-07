const stringifyValues = (values) => values.map((val) => `'${val}'`)

export const arenaDfColumnsAsCharacter = (df, columns) =>
  `arena.dfColumnsAsCharacter( ${df}, c(${stringifyValues(columns)}) )`

export const arenaDfColumnsAsLogical = (df, columns) =>
  `arena.dfColumnsAsLogical( ${df}, c(${stringifyValues(columns)}) )`

export const arenaDfColumnsAsNumeric = (df, columns) =>
  `arena.dfColumnsAsNumeric( ${df}, c(${stringifyValues(columns)}) )`
