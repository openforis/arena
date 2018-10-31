import * as R from 'ramda'

import { exportReducer } from '../../appUtils/reduxUtils'

import { surveyUpdate } from '../actions'
import { formReset } from '../form/actions'

import { codeListsUpdate } from './actions'
import { getCodeLists, assocCodeLists } from '../../../common/survey/survey'

const simulateSurveyState = (codeLists) =>
  codeLists ? {codeLists} : {}

const actionHandlers = {
  // reset form
  [surveyUpdate]: () => null,
  [formReset]: () => null,

  [codeListsUpdate]: (state, {codeLists}) => R.pipe(
    assocCodeLists(codeLists),
    getCodeLists,
  )(simulateSurveyState(state)),

}

export default exportReducer(actionHandlers)