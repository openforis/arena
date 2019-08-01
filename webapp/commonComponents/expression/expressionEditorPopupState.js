import React, { useState, useEffect } from 'react'

import Survey from '../../../common/survey/survey'
import Expression from '../../../common/exprParser/expression'

import * as AppState from '../../app/appState'
import * as SurveyState from '../../survey/surveyState'

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
  const { query, expr, mode, canBeConstant } = props

  // onMount initialize state
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
    nodeDefUuidContext, nodeDefUuidCurrent,
    mode = Expression.modes.json, isContextParent = false,
  } = props

  const nodeDefContext = Survey.getNodeDefByUuid(nodeDefUuidContext)(survey)
  const nodeDefCurrent = nodeDefUuidCurrent ? Survey.getNodeDefByUuid(nodeDefUuidCurrent)(survey) : null
  const depth = isContextParent ? 0 : 1

  const variables = ExpressionVariables.getVariables(survey, nodeDefContext, nodeDefCurrent, mode, depth, lang)

  return {
    nodeDefContext,
    nodeDefCurrent,
    variables,
  }
}