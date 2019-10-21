import * as R from 'ramda';

const keys = {
  columns: 'columns',
  filePath: 'filePath',
}

const keysColumn = {
  dataType: 'dataType',
  lang: 'lang',
  levelIndex: 'levelIndex',
  levelName: 'levelName',
  name: 'name',
  type: 'type',
}

const columnTypes = {
  code: 'code',
  description: 'description',
  extra: 'extra',
  label: 'label'
}

// ===== SUMMARY
export interface ISummary {
  columns: any[];
  filePath: string | null;
}
const newSummary: (columns: any[], filePath?: string | null) => ISummary
= (columns, filePath = null) => ({
  columns: columns,
  filePath: filePath,
})

const getColumns: (x: any) => {} = R.propOr({}, keys.columns)

// ===== COLUMN
export interface IColumn {
  type: string;
  levelName: string | null;
  levelIndex: number;
  lang: string | null;
  dataType: string | null;
}

const newColumn: (
  type: string,
  levelName?: string | null,
  levelIndex?: number,
  lang?: string | null,
  dataType?: string | null,
) => IColumn
= (type, levelName = null, levelIndex = -1, lang = null, dataType = null) => ({
  type,
  levelName,
  levelIndex,
  lang,
  dataType,
})

const getColumnType: (x: any) => string = R.prop(keysColumn.type)

const getColumnLevelName: (x: any) => string = R.prop(keysColumn.levelName)

const getColumnLevelIndex: (x: any) => number = R.prop(keysColumn.levelIndex)

const getColumnLang: (x: any) => string = R.prop(keysColumn.lang)

const getColumnDataType: (x: any) => string = R.prop(keysColumn.dataType)

const isColumnType = type => R.pipe(
  getColumnType,
  R.equals(type)
)

const isColumnCode: (x: any) => boolean = isColumnType(columnTypes.code)
const isColumnExtra: (x: any) => boolean = isColumnType(columnTypes.extra)
const isColumnLabel: (x: any) => boolean = isColumnType(columnTypes.label)
const isColumnDescription: (x: any) => boolean = isColumnType(columnTypes.description)

// ===== UTILS

const getLevelNames = R.pipe(
  getColumns,
  R.values,
  R.filter(isColumnCode),
  R.map(getColumnLevelName)
)

const getColumnName = (type, levelIndex) => R.pipe(
  getColumns,
  Object.entries,
  R.find(([columnName, column]) =>
    getColumnType(column) === type &&
    getColumnLevelIndex(column) === levelIndex),
  entry => entry ? entry[0] : null
)

const hasColumn = (type, levelIndex) => R.pipe(
  getColumnName(type, levelIndex),
  R.isNil,
  R.not
)

export default {
  columnTypes,

  keys,
  keysColumn,

  // ==== SUMMARY
  // CREATE
  newSummary,
  // READ
  getColumns,
  getFilePath: R.prop(keys.filePath),
  // UPDATE
  assocColumns: R.assoc(keys.columns),
  assocColumnDataType: (columnName, dataType) => R.assocPath([keys.columns, columnName, keysColumn.dataType], dataType),

  // ==== COLUMN
  newColumn,

  getColumnType,
  getColumnLevelName,
  getColumnLevelIndex,
  getColumnLang,
  getColumnDataType,

  isColumnCode,
  isColumnExtra,
  isColumnLabel,
  isColumnDescription,
  hasColumnLang: column => isColumnLabel(column) || isColumnDescription(column),

  // ==== utils
  getLevelNames,
  getColumnName,
  hasColumn,
};
