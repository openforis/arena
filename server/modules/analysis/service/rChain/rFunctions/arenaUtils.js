const toStringArray = (values) => `c(${values.map((val) => `'${val}'`)})`

export const arenaDfColumnsAsCharacter = (df, columns) =>
  `arena.dfColumnsAsCharacter( ${df}, ${toStringArray(columns)} )`

export const arenaDfColumnsAsLogical = (df, columns) => `arena.dfColumnsAsLogical( ${df}, ${toStringArray(columns)} )`

export const arenaDfColumnsAsNumeric = (df, columns) => `arena.dfColumnsAsNumeric( ${df}, ${toStringArray(columns)} )`
