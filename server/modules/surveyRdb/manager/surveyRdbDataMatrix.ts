type DataValue = string | number | boolean | null | undefined

type DataRow = Record<string, DataValue>

type DataMatrixParams = {
  rows: DataRow[]
  recordUuidField: string
  recordKeyFields: string[]
  rowFields: string[]
  valueField: string
}

type MatrixRow = {
  rowValues: Record<string, string>
  valuesByRecordUuid: Map<string, Set<string>>
}

type DataMatrix = {
  fields: string[]
  items: Record<string, string>[]
}

const recordKeysSeparator = ' - '
const multipleValuesSeparator = '; '

const toText = (value: DataValue): string => String(value ?? '').trim()

const compareNatural = (textA: string, textB: string): number =>
  textA.localeCompare(textB, undefined, { numeric: true })

const extractRecordLabel = (row: DataRow, { recordUuidField, recordKeyFields }: DataMatrixParams): string => {
  const keyValues = recordKeyFields.map((field) => toText(row[field])).filter(Boolean)
  return keyValues.join(recordKeysSeparator) || toText(row[recordUuidField])
}

// two records can have the same keys (reported as validation errors), but they must stay in separate columns
const generateRecordFieldNames = ({
  labelByRecordUuid,
  reservedNames,
}: {
  labelByRecordUuid: Map<string, string>
  reservedNames: string[]
}): Map<string, string> => {
  const usedNames = new Set(reservedNames)
  const fieldNameByRecordUuid = new Map<string, string>()
  const sortedEntries = [...labelByRecordUuid].sort(([, labelA], [, labelB]) => compareNatural(labelA, labelB))
  for (const [recordUuid, label] of sortedEntries) {
    let fieldName = label
    let suffix = 2
    while (usedNames.has(fieldName)) {
      fieldName = `${label} (${suffix})`
      suffix += 1
    }
    usedNames.add(fieldName)
    fieldNameByRecordUuid.set(recordUuid, fieldName)
  }
  return fieldNameByRecordUuid
}

const addValueToMatrixRow = ({
  matrixRow,
  recordUuid,
  value,
}: {
  matrixRow: MatrixRow
  recordUuid: string
  value: string
}): void => {
  if (!value) return
  const values = matrixRow.valuesByRecordUuid.get(recordUuid) ?? new Set<string>()
  values.add(value)
  matrixRow.valuesByRecordUuid.set(recordUuid, values)
}

const compareMatrixRows =
  (rowFields: string[]) =>
  (rowA: MatrixRow, rowB: MatrixRow): number => {
    for (const field of rowFields) {
      const comparison = compareNatural(rowA.rowValues[field], rowB.rowValues[field])
      if (comparison !== 0) return comparison
    }
    return 0
  }

const matrixRowToItem = (
  { rowValues, valuesByRecordUuid }: MatrixRow,
  fieldNameByRecordUuid: Map<string, string>
): Record<string, string> =>
  Object.fromEntries([
    ...Object.entries(rowValues),
    ...[...valuesByRecordUuid].map(([recordUuid, values]) => [
      fieldNameByRecordUuid.get(recordUuid),
      // repeated rows are not merged into one value: conflicting values must stay visible in the exported file
      [...values].sort(compareNatural).join(multipleValuesSeparator),
    ]),
  ])

/**
 * Pivots the rows of an entity data view: one row per combination of the row fields, one column per record.
 * @param {DataMatrixParams} params - The rows and the names of the fields to use.
 * @returns {DataMatrix} - The output fields and items.
 */
export const buildDataMatrix = (params: DataMatrixParams): DataMatrix => {
  const { rows, recordUuidField, rowFields, valueField } = params
  const [mainRowField] = rowFields
  const labelByRecordUuid = new Map<string, string>()
  const matrixRowsByKey = new Map<string, MatrixRow>()

  for (const row of rows) {
    if (toText(row[mainRowField])) {
      const recordUuid = toText(row[recordUuidField])
      labelByRecordUuid.set(recordUuid, extractRecordLabel(row, params))

      const rowValues = Object.fromEntries(rowFields.map((field) => [field, toText(row[field])]))
      const matrixRowKey = JSON.stringify(Object.values(rowValues))
      const matrixRow = matrixRowsByKey.get(matrixRowKey) ?? { rowValues, valuesByRecordUuid: new Map() }
      matrixRowsByKey.set(matrixRowKey, matrixRow)
      addValueToMatrixRow({ matrixRow, recordUuid, value: toText(row[valueField]) })
    }
  }

  const fieldNameByRecordUuid = generateRecordFieldNames({ labelByRecordUuid, reservedNames: rowFields })
  const items = [...matrixRowsByKey.values()]
    .sort(compareMatrixRows(rowFields))
    .map((matrixRow) => matrixRowToItem(matrixRow, fieldNameByRecordUuid))

  return { fields: [...rowFields, ...fieldNameByRecordUuid.values()], items }
}
