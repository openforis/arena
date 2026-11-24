import * as A from '@core/arena'

import * as ActivityLog from '@common/activityLog/activityLog'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeKeys from '@core/record/nodeKeys'

const _getParams = (survey, i18n) => (activityLog) => {
  const nodeDefUuid = ActivityLog.getContentNodeDefUuid(activityLog)
  const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)

  const parentPath = A.pipe(
    ActivityLog.getKeysHierarchy,
    NodeKeys.getKeysHierarchyPath({ survey, lang: i18n.language })
  )(activityLog)

  // Get record keys from parent path first item (root)
  const recordKeys = A.pipe(ActivityLog.getKeysHierarchy, A.head, A.prop(NodeKeys.keys.keys), A.values)(activityLog)

  return {
    name: NodeDef.getLabel(nodeDef, i18n.language),
    recordKeys,
    parentPath,
  }
}

export default {
  [ActivityLog.type.nodeCreate]: _getParams,

  [ActivityLog.type.nodeValueUpdate]: _getParams,

  [ActivityLog.type.nodeDelete]: _getParams,
}
