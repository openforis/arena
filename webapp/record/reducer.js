import * as R from 'ramda'

import { assocActionProps, exportReducer } from '../appUtils/reduxUtils'

import { recordCreated, recordUpdated } from '../record/actions'
import { assocCurrentRecord, getCurrentRecord } from '../record/recordState'
import { eventType, getNode } from '../../common/record/record'

const actionHandlers = {

  //record
  [recordCreated]: (state, {record}) => assocCurrentRecord(record)(state),

  [recordUpdated]: (state, {events}) => {
    const newState = R.clone(state)
    events.forEach(e => handleRecordEvent(e, newState))
    return newState
  },
}

const handleRecordEvent = (event, state) => {
  const record = R.prop('current')(state)
  const {node} = event
  switch (event.type) {
    case eventType.nodeAdded:
      record.nodes.push(node)
      break
    case eventType.nodeUpdated:
      const oldNode = getNode(node.id)(record)
      oldNode.value = node.value
      break
  }
  return R.assoc('current', record)(state)
}

export default exportReducer(actionHandlers)