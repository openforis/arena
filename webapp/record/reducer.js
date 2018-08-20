import * as R from 'ramda'

import { exportReducer } from '../appUtils/reduxUtils'

import { recordUpdated } from '../record/actions'
import { assocCurrentRecord, getCurrentRecord } from '../record/recordState'
import { eventType, getNode, addNode } from '../../common/record/record'

const actionHandlers = {

  //record
  [recordUpdated]: (state, {events}) => {
    //TODO do it with Ramda
    let newState = R.clone(state)
    events.forEach(e => {
      newState = handleRecordEvent(e, newState)
    })
    return newState
  },
}

const handleRecordEvent = (event, state) => {
  const {node} = event
  switch (event.type) {
    case eventType.recordCreated:
      return assocCurrentRecord(event.record)(state)
    case eventType.nodeAdded: {
      const currentRecord = getCurrentRecord(state)
      const modifiedRecord = addNode(node)(currentRecord)
      return assocCurrentRecord(modifiedRecord)(state)
    }
    case eventType.nodeUpdated: {
      const currentRecord = getCurrentRecord(state)
      const oldNode = getNode(node.id)(currentRecord)
      oldNode.value = node.value
      return assocCurrentRecord(currentRecord)(state)
    }
  }
  return state
}

export default exportReducer(actionHandlers)