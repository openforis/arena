import * as A from '@core/arena'

const getKeyValue = (keyDefName) => (record) => {
  const keyProp = A.camelize(keyDefName)
  return record[keyProp]
}

export const RecordSummary = {
  getKeyValue,
}
