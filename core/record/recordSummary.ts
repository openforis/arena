import * as A from '@core/arena'

// record summary: record props with the root entity key values camelized as props
type RecordSummaryObject = Record<string, unknown>

const getKeyValue =
  (keyDefName: string) =>
  (record: RecordSummaryObject): unknown => {
    const keyProp = A.camelize(keyDefName)
    return record[keyProp]
  }

export const RecordSummary = {
  getKeyValue,
}
