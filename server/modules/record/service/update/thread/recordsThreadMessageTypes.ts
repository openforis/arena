export const RecordsUpdateThreadMessageTypes = {
  threadKill: 'threadKill',
  threadInit: 'threadInit',

  recordInit: 'recordInit',
  recordReload: 'recordReload',
  nodePersist: 'nodePersist',
  nodeDelete: 'nodeDelete',
  nodesBatchPersist: 'nodesBatchPersist',
  // reply posted back to the main thread (see NodesBatchReplies)
  nodesBatchPersistResult: 'nodesBatchPersistResult',
  recordClear: 'recordClear',
  surveyClear: 'surveyClear',
}
