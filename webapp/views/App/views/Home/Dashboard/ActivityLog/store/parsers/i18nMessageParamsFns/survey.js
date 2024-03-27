import * as R from 'ramda'

import * as ActivityLog from '@common/activityLog/activityLog'

import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'

import * as ActivityLogMessageParserUtils from '../utils'

export default {
  [ActivityLog.type.surveyPropUpdate]: () => (activityLog) => ({
    key: ActivityLog.getContentKey(activityLog),
  }),

  [ActivityLog.type.nodeDefCreate]: (survey) => (activityLog) => {
    const nodeDef = ActivityLogMessageParserUtils.getNodeDef(survey)(activityLog)
    const nodeDefParent = R.pipe(ActivityLog.getContentParentUuid, (nodeDefUuid) =>
      Survey.getNodeDefByUuid(nodeDefUuid)(survey)
    )(activityLog)

    return {
      type: NodeDef.getType(nodeDef),
      parentName: NodeDef.getName(nodeDefParent),
    }
  },

  [ActivityLog.type.nodeDefUpdate]: (survey) => (activityLog) => {
    const content = ActivityLog.getContent(activityLog)
    const nodeDef = ActivityLogMessageParserUtils.getNodeDef(survey)(activityLog)
    return {
      keys: Object.keys({
        ...content.props,
        ...content.propsAdvanced,
      }),
      name: NodeDef.getName(nodeDef),
    }
  },

  [ActivityLog.type.nodeDefMarkDeleted]: () => (activityLog) => ({
    name: ActivityLog.getContentName(activityLog),
  }),
}
