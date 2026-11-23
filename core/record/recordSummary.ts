import * as A from '@core/arena'

// record summary: record props with the root entity key values camelized as props
type RecordSummaryObject = Record<string, unknown>

// value of a key or summary attribute, read from a data table column
export type RecordKeyValue = string | number | boolean | null

const getKeyValue =
  (keyDefName: string) =>
  (record: RecordSummaryObject): RecordKeyValue | undefined => {
    const keyProp = A.camelize(keyDefName)
    return record[keyProp] as RecordKeyValue | undefined
  }

export const RecordSummary = {
  getKeyValue,
}
