import * as R from 'ramda'
import axios from 'axios'

import * as Survey from '@core/survey/survey'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'
import * as Record from '@core/record/record'
import * as Node from '@core/record/node'

import { SurveyState } from '@webapp/store/survey'
import { LoaderActions } from '@webapp/store/ui'

import * as ActionTypes from './actionTypes'

export const checkInRecord =
  ({ recordUuid, draft, pageNodeUuid, pageNodeDefUuid, insideMap }) =>
  async (dispatch, getState) => {
    dispatch(LoaderActions.showLoader())

    const surveyId = SurveyState.getSurveyId(getState())
    const {
      data: { record },
    } = await axios.post(`/api/survey/${surveyId}/record/${recordUuid}/checkin`, {
      draft,
    })

    if (!record) {
      dispatch({ type: ActionTypes.recordLoadError, error: 'recordView.recordNotFound' })
      dispatch(LoaderActions.hideLoader())
      return
    }

    // This is used by dataQuery when user is editing a specific entity
    if (pageNodeUuid) {
      const state = getState()
      const survey = SurveyState.getSurvey(state)
      const cycle = Record.getCycle(record)

      // Ancestors are needed to find the entity with a pageUuid specified
      const entity = Record.getNodeByUuid(pageNodeUuid)(record)
      const ancestors = Record.getAncestorsAndSelf(entity)(record)
      const pageNodeDef = Survey.getNodeDefByUuid(pageNodeDefUuid)(survey)

      /*
      If a node def to focus is specified and it has its own page, use it as active page,
      otherwise use the one of the first ancestor where it's defined
      */
      const nodeDefActivePage =
        pageNodeDef && NodeDefLayout.hasPage(cycle)(pageNodeDef)
          ? pageNodeDef
          : R.pipe(
              R.map((ancestor) => Survey.getNodeDefByUuid(Node.getNodeDefUuid(ancestor))(survey)),
              R.find(NodeDefLayout.hasPage(cycle))
            )(ancestors)

      // Getting the nodes associated to the nodeDef page
      const formPageNodeUuidByNodeDefUuid = R.reduce(
        (acc, ancestor) => R.assoc(Node.getNodeDefUuid(ancestor), Node.getUuid(ancestor), acc),
        [],
        ancestors
      )

      dispatch({
        type: ActionTypes.recordLoad,
        record,
        nodeDefActivePage,
        formPageNodeUuidByNodeDefUuid,
        insideMap,
      })
    } else {
      dispatch({ type: ActionTypes.recordLoad, record, insideMap })
    }

    // Hide app loader on record edit
    if (!R.isEmpty(Record.getNodes(record))) {
      dispatch(LoaderActions.hideLoader())
    }
  }

export const checkOutRecord = (recordUuid) => async (dispatch, getState) => {
  const surveyId = SurveyState.getSurveyId(getState())
  // Checkout can be called after logout, therefore checking if survey still exists in state
  if (surveyId) {
    await axios.post(`/api/survey/${surveyId}/record/${recordUuid}/checkout`)
  }
}
