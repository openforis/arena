import { quote } from '@core/stringUtils'

const stringifyValues = (values: any) => values.map(quote)

export const arenaDfColumnsAsCharacter = (df: any, columns: any) =>
  `arena.dfColumnsAsCharacter( ${df}, c(${stringifyValues(columns)}) )`

export const arenaDfColumnsAsLogical = (df: any, columns: any) =>
  `arena.dfColumnsAsLogical( ${df}, c(${stringifyValues(columns)}) )`

export const arenaDfColumnsAsNumeric = (df: any, columns: any) =>
  `arena.dfColumnsAsNumeric( ${df}, c(${stringifyValues(columns)}) )`
