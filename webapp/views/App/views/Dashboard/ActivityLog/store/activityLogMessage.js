import * as A from '@core/arena'
import * as ActivityLog from '@common/activityLog/activityLog'

export const keys = {
  id: ActivityLog.keys.id,
  message: 'message',
  itemDeleted: 'itemDeleted',
  highlighted: 'highlighted',
}

// ====== CREATE

export const newMessage = (activityLog, message, itemDeleted, highlighted = false) => ({
  ...A.omit([ActivityLog.keys.content], activityLog),
  [keys.message]: message,
  [keys.itemDeleted]: itemDeleted,
  [keys.highlighted]: highlighted,
})

// ====== READ

export const { getId, getUserUuid, getUserName, getType, getDateCreated } = ActivityLog
export const getMessage = A.prop(keys.message)
export const isItemDeleted = A.propEq(keys.itemDeleted, true)
export const isHighlighted = A.propEq(keys.highlighted, true)

// ====== UPDATE

export const dissocHighlighted = A.dissoc(keys.highlighted)
