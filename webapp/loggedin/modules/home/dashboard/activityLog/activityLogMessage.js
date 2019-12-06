import * as R from 'ramda'
import * as ActivityLog from '@common/activityLog/activityLog'

export const keys = {
  id: ActivityLog.keys.id,
  message: 'message',
  itemDeleted: 'itemDeleted',
  highlighted: 'highlighted',
}

// ====== CREATE

export const newMessage = (activityLog, message, itemDeleted, highlighted = false) => ({
  ...R.omit([ActivityLog.keys.content], activityLog),
  [keys.message]: message,
  [keys.itemDeleted]: itemDeleted,
  [keys.highlighted]: highlighted,
})

// ====== READ

export const getId = ActivityLog.getId
export const getUserUuid = ActivityLog.getUserUuid
export const getUserName = ActivityLog.getUserName
export const getType = ActivityLog.getType
export const getDateCreated = ActivityLog.getDateCreated
export const getMessage = R.prop(keys.message)
export const isItemDeleted = R.propEq(keys.itemDeleted, true)
export const isHighlighted = R.propEq(keys.highlighted, true)
