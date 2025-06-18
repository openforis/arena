const getName = (field) => (typeof field === 'object' ? field.name : field)

const getNames = (fields) => fields?.map(getName)

const getType = (field) => (typeof field === 'object' ? field.type : 'string')

export const CsvField = {
  getName,
  getNames,
  getType,
}
