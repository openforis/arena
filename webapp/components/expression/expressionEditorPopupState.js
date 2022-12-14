import { useState, useEffect } from 'react'

import * as Survey from '@core/survey/survey'
import * as Expression from '@core/expressionParser/expression'

import { useLang } from '@webapp/store/system'
import { useSurvey } from '@webapp/store/survey'

import * as ExpressionParser from './expressionParser'
import * as ExpressionVariables from './expressionVariables'
import { ExpressionEditorType } from './expressionEditorType'

const initialState = {
  query: '',
  queryDraft: '',
  exprDraft: null,
  exprDraftValid: true,
}

export const useExpressionEditorPopupState = (props) => {
  const {
    canBeConstant,
    expr,
    mode,
    type,
    nodeDefUuidContext,
    nodeDefUuidCurrent,
    onChange,
    query,
    groupByParent = true,
  } = props

  const survey = useSurvey()
  const lang = useLang()
  const editorType = type.length === 1 ? type[0] : null

  // An encoding trick. Newlines can only appear in a textarea,
  // so denote advanced mode expressions as anything that contains a newline.
  // The editing component ensures that all intermediate values will contain one.
  const initialAdvanced = editorType === ExpressionEditorType.advanced || /\n/.test(query)
  const [advanced, setAdvancedEditor] = useState(initialAdvanced)
  const [state, setState] = useState(initialState)
  const [expressionCanBeApplied, setExpressionCanBeApplied] = useState(false)

  // OnMount initialize state
  useEffect(() => {
    // Either expr or query are passed by the parent component
    const exprDraft = expr || ExpressionParser.parseQuery(query, mode, canBeConstant)
    const queryDraft = Expression.toString(exprDraft, mode)

    setState({
      query: advanced ? query.trimRight() : queryDraft,
      queryDraft: advanced ? query.trimRight() : queryDraft,
      exprDraft,
      exprDraftValid: true,
    })
  }, [])

  const updateDraftExpr = (exprDraft) => {
    const queryDraft = Expression.toString(exprDraft, mode)
    const exprDraftValid = ExpressionParser.isExprValid(exprDraft, canBeConstant)

    setExpressionCanBeApplied(query !== queryDraft && exprDraftValid)

    setState((prevState) => ({
      ...prevState,
      queryDraft,
      exprDraft,
      exprDraftValid,
    }))
  }

  const updateDraftQuery = (queryDraft) => {
    const exprDraft = queryDraft === '' ? null : Expression.fromString(queryDraft, mode)
    const exprDraftValid = queryDraft === '' ? null : ExpressionParser.isExprValid(exprDraft, canBeConstant)

    setState((prevState) => ({
      ...prevState,
      queryDraft,
      exprDraft,
      exprDraftValid,
    }))
  }

  const resetDraftQuery = () => {
    setExpressionCanBeApplied(query !== '')

    setState((prevState) => ({
      ...prevState,
      queryDraft: '',
      exprDraft: ExpressionParser.parseQuery('', mode, canBeConstant),
      exprDraftValid: true,
    }))
  }

  const onToggleAdvancedEditor = () => {
    if (advanced) {
      resetDraftQuery()
    }
    setAdvancedEditor(!advanced)
  }

  const onApply = () => {
    // By adding a newline to all onChange() params, we specify that
    // the query was written with this advanced expression editor.
    // With this, we can always open the query (i.e. the expression)
    // in advanced editor directly.
    const { exprDraft, queryDraft } = state
    const queryUpdated = advanced ? `${queryDraft.trimEnd()}\n` : queryDraft
    onChange({ query: queryUpdated, expr: exprDraft })
  }

  const nodeDefContext = Survey.getNodeDefByUuid(nodeDefUuidContext)(survey)
  const nodeDefCurrent = nodeDefUuidCurrent ? Survey.getNodeDefByUuid(nodeDefUuidCurrent)(survey) : null

  const variables = ExpressionVariables.getVariables({
    survey,
    nodeDefContext,
    nodeDefCurrent,
    mode,
    lang,
    groupByParent,
    editorType,
  })

  return {
    ...state,
    advanced,
    expressionCanBeApplied,
    nodeDefCurrent,
    onApply,
    onToggleAdvancedEditor,
    resetDraftQuery,
    setExpressionCanBeApplied,
    updateDraftExpr,
    updateDraftQuery,
    variables,
  }
}
