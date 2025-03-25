export const ConflictResolutionStrategy = {
  skipExisting: 'skipExisting', // import only new records
  overwriteIfUpdated: 'overwriteIfUpdated', // overwrite record values if record being imported has any updated values
  merge: 'merge', // merge records with same keys
}
