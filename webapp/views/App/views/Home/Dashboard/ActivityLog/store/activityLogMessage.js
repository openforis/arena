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

export const { getId, getUserUuid, getUserName, getType, getDateCreated } = ActivityLog
export const getMessage = R.prop(keys.message)
export const isItemDeleted = R.propEq(keys.itemDeleted, true)
export const isHighlighted = R.propEq(keys.highlighted, true)

// ====== UPDATE

export const dissocHighlighted = R.dissoc(keys.highlighted)
