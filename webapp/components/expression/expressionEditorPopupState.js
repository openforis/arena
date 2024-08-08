import { useState, useEffect, useCallback } from 'react'

import * as Survey from '@core/survey/survey'
import * as Expression from '@core/expressionParser/expression'

import { useLang } from '@webapp/store/system'
import { useSurvey, useSurveyCycleKey } from '@webapp/store/survey'

import * as ExpressionParser from './expressionParser'
import * as ExpressionVariables from './expressionVariables'
import { ExpressionEditorType } from './expressionEditorType'

const initialState = {
  query: '',
  queryDraft: '',
  exprDraft: null,
  exprDraftValid: true,
}

const ADVANCED_EXPRESSION_SUFFIX = '\n'

export const useExpressionEditorPopupState = (props) => {
  const {
    canBeConstant,
    canBeCall,
    excludeCurrentNodeDef,
    expr,
    mode,
    type,
    nodeDefUuidContext,
    nodeDefUuidCurrent,
    onChange,
    query,
    groupByParent = true,
    includeAnalysis = false,
  } = props

  const survey = useSurvey()
  const cycle = useSurveyCycleKey()
  const lang = useLang()
  const editorType = type.length === 1 ? type[0] : null

  // An encoding trick. Newlines can only appear in a textarea,
  // so denote advanced mode expressions as anything that contains a newline.
  // The editing component ensures that all intermediate values will contain one.
  const initialAdvanced =
    editorType === ExpressionEditorType.advanced || new RegExp(ADVANCED_EXPRESSION_SUFFIX).test(query)
  const [state, setState] = useState(initialState)

  // OnMount initialize state
  useEffect(() => {
    // Either expr or query are passed by the parent component
    let exprDraft
    try {
      exprDraft = expr ?? ExpressionParser.parseQuery({ query, mode, canBeConstant })
    } catch (error) {
      exprDraft = ExpressionParser.parseQuery({ query: '', mode, canBeConstant })
    }
    const queryDraft = Expression.toString(exprDraft, mode)

    setState({
      advanced: initialAdvanced,
      query: initialAdvanced ? query.trimRight() : queryDraft,
      queryDraft: initialAdvanced ? query.trimRight() : queryDraft,
      queryIsBasic: !initialAdvanced,
      exprDraft,
      exprDraftValid: true,
      expressionCanBeApplied: false,
    })
  }, [])

  const updateDraftExpr = (exprDraft) => {
    const queryDraft = Expression.toString(exprDraft, mode)
    const exprDraftValid = ExpressionParser.isExprValid({ expr: exprDraft, canBeConstant, canBeCall })

    setState((prevState) => ({
      ...prevState,
      queryDraft,
      exprDraft,
      exprDraftValid,
      expressionCanBeApplied: query !== queryDraft && exprDraftValid,
      queryIsBasic: true,
    }))
  }

  const updateDraftQuery = useCallback(
    (queryDraft) => {
      const exprDraft = queryDraft === '' ? null : Expression.fromString(queryDraft, mode)
      const exprDraftValid =
        queryDraft === '' ? null : ExpressionParser.isExprValid({ expr: exprDraft, canBeConstant, canBeCall })

      setState((prevState) => ({
        ...prevState,
        queryDraft,
        exprDraft,
        exprDraftValid,
        expressionCanBeApplied: queryDraft !== prevState.query,
        queryIsBasic: false,
      }))
    },
    [canBeCall, canBeConstant, mode]
  )

  const resetDraftQuery = () => {
    setState((prevState) => ({
      ...prevState,
      queryDraft: '',
      exprDraft: ExpressionParser.parseQuery({ query: '', mode, canBeConstant }),
      exprDraftValid: true,
      expressionCanBeApplied: query !== '',
    }))
  }

  const onToggleAdvancedEditor = () => {
    const { advanced, queryIsBasic } = state

    if (advanced && !queryIsBasic) {
      resetDraftQuery()
    }
    const queryIsBasicNext = queryIsBasic || (advanced && !queryIsBasic)
    setState((prevState) => ({ ...prevState, advanced: !advanced, queryIsBasic: queryIsBasicNext }))
  }

  const onApply = () => {
    // By adding a newline to all onChange() params, we specify that
    // the query was written with this advanced expression editor.
    // With this, we can always open the query (i.e. the expression)
    // in advanced editor directly.
    const { advanced, exprDraft, queryDraft } = state
    const queryUpdated = advanced ? `${queryDraft.trimEnd()}${ADVANCED_EXPRESSION_SUFFIX}` : queryDraft
    onChange({ query: queryUpdated, expr: exprDraft })
  }

  const nodeDefContext = Survey.getNodeDefByUuid(nodeDefUuidContext)(survey)
  const nodeDefCurrent = nodeDefUuidCurrent ? Survey.getNodeDefByUuid(nodeDefUuidCurrent)(survey) : null

  const variables = ExpressionVariables.getVariables({
    survey,
    cycle,
    nodeDefContext,
    nodeDefCurrent,
    mode,
    lang,
    groupByParent,
    editorType,
    excludeCurrentNodeDef,
    includeAnalysis,
  })

  return {
    ...state,
    nodeDefCurrent,
    onApply,
    onToggleAdvancedEditor,
    resetDraftQuery,
    updateDraftExpr,
    updateDraftQuery,
    variables,
  }
}
