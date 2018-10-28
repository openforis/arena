import * as R from 'ramda'

import { exportReducer } from '../../appUtils/reduxUtils'

import { surveyCurrentUpdate } from '../actions'
import { formReset } from '../form/actions'

import { nodeDefDelete, nodeDefPropUpdate, nodeDefsUpdate, nodeDefUpdate } from './actions'

import {
  getNodeDefs,
  assocNodeDef,
  assocNodeDefProp,
  assocNodeDefs,
  dissocNodeDef
} from '../../../common/survey/survey'

const simulateSurveyState = (nodeDefs) =>
  nodeDefs ? {nodeDefs} : {}

const actionHandlers = {
  // reset form
  [surveyCurrentUpdate]: () => null,
  [formReset]: () => null,

  [nodeDefsUpdate]: (state = {}, {nodeDefs}) => R.pipe(
    assocNodeDefs(nodeDefs),
    getNodeDefs,
  )(simulateSurveyState(state)),

  [nodeDefUpdate]: (state, {nodeDef}) => R.pipe(
    assocNodeDef(nodeDef),
    getNodeDefs,
  )(simulateSurveyState(state)),

  [nodeDefPropUpdate]: (state, {nodeDefUUID, key, value}) => R.pipe(
    assocNodeDefProp(nodeDefUUID, key, value),
    getNodeDefs,
  )(simulateSurveyState(state)),

  [nodeDefDelete]: (state, {nodeDef}) => R.pipe(
    dissocNodeDef(nodeDef),
    getNodeDefs,
  )(simulateSurveyState(state)),

}

export default exportReducer(actionHandlers)