import * as Survey from '@core/survey/survey'
import * as Category from '@core/survey/category'
import * as StringUtils from '@core/stringUtils'

import * as ActivityLog from '@common/activityLog/activityLog'

const isItemDeletedFns = {
  [ActivityLog.type.nodeDefUpdate]: (i18n, survey, activityLog) =>
    StringUtils.isBlank(ActivityLog.getNodeDefName(activityLog)),


}

const customParamsFns = {
  [ActivityLog.type.nodeDefUpdate]: activityLog => {
    const content = ActivityLog.getContent(activityLog)

    return {
      keys: Object.keys({
        ...content.props,
        ...content.propsAdvanced,
      })
    }
  }
}

export const generate = (i18n, survey, activityLog) => {
  const activityType = ActivityLog.getType(activityLog)
  const customParamsFn = customParamsFns[activityType]
  const customParams = customParamsFn ? customParamsFn(activityLog) : {}

  const params = {
    ...ActivityLog.getContent(activityLog),
    nodeDefName: ActivityLog.getNodeDefName(activityLog),
    nodeDefParentName: ActivityLog.getNodeDefName(activityLog),
    categoryName: ActivityLog.getCategoryName(activityLog),
    ...customParams
  }

  return {
    message: i18n.t(`activityLogView.messages.${activityType}`, params),
    itemDeleted: !!isItemDeletedFns[activityType]
  }
}