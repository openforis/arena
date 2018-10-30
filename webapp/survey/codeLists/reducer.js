import * as R from 'ramda'

import { exportReducer } from '../../appUtils/reduxUtils'

import { surveyCurrentUpdate } from '../actions'
import { formReset } from '../form/actions'

import { codeListsUpdate } from './actions'
import { getCodeLists, assocCodeLists } from '../../../common/survey/survey'

const simulateSurveyState = (codeLists) =>
  codeLists ? {codeLists} : {}

const actionHandlers = {
  // reset form
  [surveyCurrentUpdate]: () => null,
  [formReset]: () => null,

  [codeListsUpdate]: (state, {codeLists}) => R.pipe(
    assocCodeLists(codeLists),
    getCodeLists,
  )(simulateSurveyState(state)),

}

export default exportReducer(actionHandlers)