import type { ArenaFlatDataExportOptions } from '@openforis/arena-core'

import type { Query } from '@common/model/query'
import type { FileFormat } from '@core/fileFormats'

// options of the flat data export (records data, Data Explorer query data and aggregated data)
export type DataExportOptions = ArenaFlatDataExportOptions & {
  fileFormat?: FileFormat
  includeDataFromAllCycles?: boolean
  recordsModifiedAfter?: string | null
  recordsModifiedBefore?: string | null
}

// options of the export of the data of a multiple entity as a matrix (one column per record)
export type DataMatrixExportOptions = {
  entityDefUuid: string
  rowAttributeDefUuids: string[]
  valueAttributeDefUuid: string
  // all the root key defs when not specified
  recordKeyAttributeDefUuids?: string[] | null
  filter?: Query.QueryItem['filter'] | null
  fileFormat?: FileFormat
}
