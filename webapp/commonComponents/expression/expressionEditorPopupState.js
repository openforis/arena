import React, {useState, useEffect} from 'react'

import * as Survey from '@core/survey/survey'
import * as Expression from '@core/expressionParser/expression'

import * as AppState from '@webapp/app/appState'
import * as SurveyState from '@webapp/survey/surveyState'

import * as ExpressionParser from './expressionParser'
import * as ExpressionVariables from './expressionVariables'

const initialState = {
  query: '',
  queryDraft: '',
  exprDraft: null,
  exprDraftValid: true,
}

export const useExpressionEditorPopupState = props => {
  const [state, setState] = useState(initialState)
  const {query, expr, mode, canBeConstant} = props

  // OnMount initialize state
  useEffect(() => {
    // Either expr or query are passed by the parent component
    const exprDraft = expr || ExpressionParser.parseQuery(query, mode, canBeConstant)
    const queryDraft = Expression.toString(exprDraft, mode)

    setState({
      query: queryDraft,
      queryDraft,
      exprDraft,
      exprDraftValid: true,
    })
  }, [])

  const updateDraft = exprDraft => {
    const queryDraft = Expression.toString(exprDraft, mode)
    const exprDraftValid = ExpressionParser.isExprValid(exprDraft, canBeConstant)
    setState(statePrev => ({
      ...statePrev,
      queryDraft, exprDraft, exprDraftValid
    }))
  }

  return {
    ...state,
    updateDraft
  }
}

export const mapStateToProps = (state, props) => {
  const survey = SurveyState.getSurvey(state)
  const lang = AppState.getLang(state)

  const {
    nodeDefUuidContext,
    nodeDefUuidCurrent,
    mode = Expression.modes.json,
  } = props

  const nodeDefContext = Survey.getNodeDefByUuid(nodeDefUuidContext)(survey)
  const nodeDefCurrent = nodeDefUuidCurrent ? Survey.getNodeDefByUuid(nodeDefUuidCurrent)(survey) : null

  const variables = ExpressionVariables.getVariables(survey, nodeDefContext, nodeDefCurrent, mode, lang)

  return {
    nodeDefContext,
    nodeDefCurrent,
    variables,
  }
}
