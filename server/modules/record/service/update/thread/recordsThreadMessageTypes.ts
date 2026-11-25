export const RecordsUpdateThreadMessageTypes = {
  threadKill: 'threadKill',
  threadInit: 'threadInit',

  recordInit: 'recordInit',
  // record opened for editing: app info dependent expressions evaluated again if the app changed
  recordAppInfoUpdate: 'recordAppInfoUpdate',
  recordReload: 'recordReload',
  nodePersist: 'nodePersist',
  nodeDelete: 'nodeDelete',
  nodesBatchPersist: 'nodesBatchPersist',
  // reply posted back to the main thread (see NodesBatchReplies)
  nodesBatchPersistResult: 'nodesBatchPersistResult',
  recordClear: 'recordClear',
  surveyClear: 'surveyClear',
}
