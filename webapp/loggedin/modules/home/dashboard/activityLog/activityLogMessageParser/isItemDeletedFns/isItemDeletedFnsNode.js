import * as R from 'ramda'

import * as ActivityLog from '@common/activityLog/activityLog'

const _isNodeDeleted = R.pipe(ActivityLog.getNodeDefUuid, R.isNil)

export default {
  [ActivityLog.type.nodeCreate]: () => _isNodeDeleted,

  [ActivityLog.type.nodeValueUpdate]: () => _isNodeDeleted,

  [ActivityLog.type.nodeDelete]: () => activityLog => {
    const parentPath = ActivityLog.getParentPath(activityLog)
    //nodeDefUuid in parent path elements will be null if the corresponding node has been deleted
    return R.any(({ nodeDefUuid }) => R.isNil(nodeDefUuid))(parentPath)
  }
}
