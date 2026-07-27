export const RecordImportAction = {
  insert: 'insert', // record does not exist yet; it will be inserted
  overwrite: 'overwrite', // record already exists (same uuid); it will be overwritten
  merge: 'merge', // record already exists (matched by key attributes); it will be merged into it
  skip: 'skip', // record already exists and will not be updated
} as const

export type RecordImportActionType = (typeof RecordImportAction)[keyof typeof RecordImportAction]
