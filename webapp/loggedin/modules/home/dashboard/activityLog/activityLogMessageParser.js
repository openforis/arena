import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Category from '@core/survey/category'
import * as StringUtils from '@core/stringUtils'

import * as ActivityLog from '@common/activityLog/activityLog'
import * as ActivityLogMessage from './activityLogMessage'

const _getNodeDef = survey => R.pipe(
  ActivityLog.getContentUuid,
  nodeDefUuid => Survey.getNodeDefByUuid(nodeDefUuid)(survey)
)

const isItemDeletedFns = {
  [ActivityLog.type.nodeDefCreate]: survey => R.pipe(
    _getNodeDef(survey),
    R.isNil
  ),

  [ActivityLog.type.nodeDefUpdate]: survey => R.pipe(
    _getNodeDef(survey),
    R.isNil
  ),

}

const paramsI18nMessageFns = {
  [ActivityLog.type.nodeDefCreate]: survey => activityLog => {
    const nodeDef = _getNodeDef(survey)(activityLog)
    const nodeDefParent = R.pipe(
      ActivityLog.getContentParentUuid,
      nodeDefUuid => Survey.getNodeDefByUuid(nodeDefUuid)(survey)
    )(activityLog)

    return {
      type: NodeDef.getType(nodeDef),
      parentName: NodeDef.getName(nodeDefParent)
    }
  },

  [ActivityLog.type.nodeDefUpdate]: survey => activityLog => {
    const content = ActivityLog.getContent(activityLog)
    const nodeDef = _getNodeDef(survey)(activityLog)
    return {
      keys: Object.keys({
        ...content.props,
        ...content.propsAdvanced,
      }),
      name: NodeDef.getName(nodeDef)
    }
  },

  [ActivityLog.type.nodeDefMarkDeleted]: _ => activityLog => ({
    name: ActivityLog.getContentName(activityLog)
  }),
}

export const toMessage = (i18n, survey) => activityLog => {
  const type = ActivityLog.getType(activityLog)

  const paramsI18nMessageFn = paramsI18nMessageFns[type]
  const paramsI18nMessage = paramsI18nMessageFn ? paramsI18nMessageFn(survey)(activityLog) : {}
  const message = i18n.t(`activityLogView.messages.${type}`, paramsI18nMessage)

  const itemDeletedFn = isItemDeletedFns[type]
  const itemDeleted = itemDeletedFn && itemDeletedFn(survey)(activityLog)

  return ActivityLogMessage.newMessage(activityLog, message, itemDeleted)
}