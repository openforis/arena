import * as ActivityLog from '@common/activityLog/activityLog'

import * as ActivityLogMessage from '../activityLogMessage'

import i18nMessageParamsFns from './i18nMessageParamsFns'
import isItemDeletedFns from './isItemDeletedFns'

export const toMessage =
  (i18n, survey, highlighted = true) =>
  (activityLog) => {
    const type = ActivityLog.getType(activityLog)
    const content = ActivityLog.getContent(activityLog)

    const i18nMessageParamsFn = i18nMessageParamsFns[type]
    const i18nMessageParams = i18nMessageParamsFn ? i18nMessageParamsFn(survey, i18n)(activityLog) : content
    const message = i18n.t(`activityLog:messages.${type}`, i18nMessageParams)

    const isItemDeletedFn = isItemDeletedFns[type]
    const itemDeleted = isItemDeletedFn && isItemDeletedFn(survey)(activityLog)

    return ActivityLogMessage.newMessage(activityLog, message, itemDeleted, highlighted)
  }
