const conflictResolutionStrategies = {
  skipDuplicates: 'skipDuplicates', // import only new records
  overwriteIfUpdated: 'overwriteIfUpdated', // overwrite record values if record being imported has any updated values
}

export const ArenaMobileDataImport = {
  conflictResolutionStrategies,
}
