import * as ActivityLog from '@common/activityLog/activityLog'

import * as ActivityLogMessage from './activityLogMessage'

import i18nMessageParamsFnsSurvey from './activityLogMessageParser/i18nMessageParamsFns/i18nMessageParamsFnsSurvey'
import i18nMessageParamsFnsCategory from './activityLogMessageParser/i18nMessageParamsFns/i18nMessageParamsFnsCategory'
import i18nMessageParamsFnsTaxonomy from './activityLogMessageParser/i18nMessageParamsFns/i18nMessageParamsFnsTaxonomy'
import i18nMessageParamsFnsRecord from './activityLogMessageParser/i18nMessageParamsFns/i18nMessageParamsFnsRecord'
import i18nMessageParamsFnsUser from './activityLogMessageParser/i18nMessageParamsFns/i18nMessageParamsFnsUser'
import i18nMessageParamsFnsAnalysis from './activityLogMessageParser/i18nMessageParamsFns/i18nMessageParamsFnsAnalysis'

import isItemDeletedFnsSurvey from './activityLogMessageParser/isItemDeletedFns/isItemDeletedFnsSurvey'
import isItemDeletedFnsCategory from './activityLogMessageParser/isItemDeletedFns/isItemDeletedFnsCategory'
import isItemDeletedFnsTaxonomy from './activityLogMessageParser/isItemDeletedFns/isItemDeletedFnsTaxonomy'
import isItemDeletedFnsRecord from './activityLogMessageParser/isItemDeletedFns/isItemDeletedFnsRecord'
import isItemDeletedFnsUser from './activityLogMessageParser/isItemDeletedFns/isItemDeletedFnsUser'

const i18nMessageParamsFns = {
  ...i18nMessageParamsFnsSurvey,
  ...i18nMessageParamsFnsCategory,
  ...i18nMessageParamsFnsTaxonomy,
  ...i18nMessageParamsFnsRecord,
  ...i18nMessageParamsFnsUser,
  ...i18nMessageParamsFnsAnalysis,
}

const isItemDeletedFns = {
  ...isItemDeletedFnsSurvey,
  ...isItemDeletedFnsCategory,
  ...isItemDeletedFnsTaxonomy,
  ...isItemDeletedFnsRecord,
  ...isItemDeletedFnsUser,
}

export const toMessage = (i18n, survey) => activityLog => {
  const type = ActivityLog.getType(activityLog)

  const i18nMessageParamsFn = i18nMessageParamsFns[type]
  const i18nMessageParams = i18nMessageParamsFn ? i18nMessageParamsFn(survey, i18n)(activityLog) : {}
  const message = i18n.t(`activityLogView.messages.${type}`, i18nMessageParams)

  const isItemDeletedFn = isItemDeletedFns[type]
  const itemDeleted = isItemDeletedFn && isItemDeletedFn(survey)(activityLog)

  return ActivityLogMessage.newMessage(activityLog, message, itemDeleted)
}