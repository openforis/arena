// field name, or field with name and type (e.g. number)
export type CsvFieldItem = string | { name: string; type?: string }

const getName = (field: CsvFieldItem): string => (typeof field === 'object' ? field.name : field)

const getNames = (fields: CsvFieldItem[] | null | undefined): string[] | undefined => fields?.map(getName)

const getType = (field: CsvFieldItem): string | undefined => (typeof field === 'object' ? field.type : 'string')

export const CsvField = {
  getName,
  getNames,
  getType,
}
