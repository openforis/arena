import * as A from '@core/arena'
import * as Record from '@core/record/record'

import { LoaderActions } from '@webapp/store/ui'

import * as RecordState from '../state'
import * as ActionTypes from './actionTypes'

export const recordNodesUpdate = (nodes) => (dispatch, getState) => {
  const record = RecordState.getRecord(getState())
  // Hide app loader on record create
  if (A.isEmpty(Record.getNodes(record))) {
    dispatch(LoaderActions.hideLoader())
  }

  dispatch({ type: ActionTypes.nodesUpdate, nodes: nodes })
}
