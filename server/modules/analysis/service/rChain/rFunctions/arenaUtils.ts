import { quote } from '@core/stringUtils'

const stringifyValues = (values: string[]) => values.map(quote)

export const arenaDfColumnsAsCharacter = (df: string, columns: string[]) =>
  `arena.dfColumnsAsCharacter( ${df}, c(${stringifyValues(columns)}) )`

export const arenaDfColumnsAsLogical = (df: string, columns: string[]) =>
  `arena.dfColumnsAsLogical( ${df}, c(${stringifyValues(columns)}) )`

export const arenaDfColumnsAsNumeric = (df: string, columns: string[]) =>
  `arena.dfColumnsAsNumeric( ${df}, c(${stringifyValues(columns)}) )`
