import * as A from '@core/arena'

import * as ActivityLog from '@common/activityLog/activityLog'

const _isNodeDeleted = A.pipe(ActivityLog.getNodeDefUuid, A.isNil)

export default {
  [ActivityLog.type.nodeCreate]: () => _isNodeDeleted,

  [ActivityLog.type.nodeValueUpdate]: () => _isNodeDeleted,

  [ActivityLog.type.nodeDelete]: () => (activityLog) => {
    const keysHierarchy = ActivityLog.getKeysHierarchy(activityLog)
    // NodeDefUuid in parent path elements will be null if the corresponding node has been deleted
    return A.any(({ nodeDefUuid }) => A.isNil(nodeDefUuid))(keysHierarchy)
  },
}
