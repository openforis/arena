import { useState, useEffect, useCallback } from 'react'

import * as Survey from '@core/survey/survey'
import * as Expression from '@core/expressionParser/expression'

import { useSurvey, useSurveyCycleKey, useSurveyPreferredLang } from '@webapp/store/survey'
import { ExpressionEditorStorage } from '@webapp/service/storage/expressionEditor'

import * as ExpressionParser from './expressionParser'
import * as ExpressionVariables from './expressionVariables'
import { ExpressionEditorType } from './expressionEditorType'

const initialState = {
  query: '',
  queryDraft: '',
  exprDraft: null,
  exprDraftValid: true,
}

// Newlines can only appear in a textarea, so a trailing newline denotes an advanced mode expression.
export const ADVANCED_EXPRESSION_SUFFIX = '\n'

const getExpressionOrParseQuery = ({ expr, query, mode, canBeConstant }) => {
  try {
    return expr ?? ExpressionParser.parseQuery({ query, mode, canBeConstant })
  } catch (error) {
    return ExpressionParser.parseQuery({ query: '', mode, canBeConstant })
  }
}

// the text mode (syntax) only affects how the expression is written; mode still determines the available variables
const getTextModeInitial = ({ mode, textModeSelectable }) => {
  if (!textModeSelectable) return mode
  const textModeStored = ExpressionEditorStorage.getTextMode()
  return Object.values(Expression.modes).includes(textModeStored) ? textModeStored : mode
}

export const useExpressionEditorPopupState = (props) => {
  const {
    canBeConstant,
    canBeCall,
    excludeCurrentNodeDef,
    expr,
    mode,
    textModeSelectable = false,
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
  const lang = useSurveyPreferredLang()
  const editorType = type.length === 1 ? type[0] : null

  // The editing component ensures that all intermediate values will contain a newline.
  const initialAdvanced =
    editorType === ExpressionEditorType.advanced || new RegExp(ADVANCED_EXPRESSION_SUFFIX).test(query)

  const [state, setState] = useState(() => {
    const textMode = getTextModeInitial({ mode, textModeSelectable })
    // Either expr or query are passed by the parent component
    const exprDraft = getExpressionOrParseQuery({ expr, query, mode, canBeConstant })
    const queryDraft = Expression.toString(exprDraft, textMode)
    const queryAdvanced = initialAdvanced
      ? ExpressionParser.convertQueryTextMode({ query: query.trimEnd(), textModeFrom: mode, textModeTo: textMode })
      : null

    return {
      ...initialState,
      advanced: initialAdvanced,
      textMode,
      query: queryAdvanced ?? queryDraft,
      queryDraft: queryAdvanced ?? queryDraft,
      queryIsBasic: !initialAdvanced,
      exprDraft,
      exprDraftValid: true,
      expressionCanBeApplied: false,
    }
  })

  const { textMode } = state

  const updateDraftExpr = (exprDraft) => {
    const queryDraft = Expression.toString(exprDraft, textMode)
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
      const exprDraft = queryDraft === '' ? null : Expression.fromString(queryDraft, textMode)
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
    [canBeCall, canBeConstant, textMode]
  )

  const resetDraftQuery = () => {
    setState((prevState) => ({
      ...prevState,
      queryDraft: '',
      exprDraft: ExpressionParser.parseQuery({ query: '', mode: textMode, canBeConstant }),
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

  const onChangeTextMode = (textModeNext) => {
    ExpressionEditorStorage.setTextMode(textModeNext)
    setState((prevState) => {
      const convert = (queryText) =>
        ExpressionParser.convertQueryTextMode({
          query: queryText,
          textModeFrom: prevState.textMode,
          textModeTo: textModeNext,
        })
      return {
        ...prevState,
        textMode: textModeNext,
        query: convert(prevState.query),
        queryDraft: convert(prevState.queryDraft),
      }
    })
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

  const nodeDefCurrent = nodeDefUuidCurrent ? Survey.getNodeDefByUuid(nodeDefUuidCurrent)(survey) : null

  const [variables, setVariables] = useState([])
  useEffect(() => {
    const nodeDefContext = Survey.getNodeDefByUuid(nodeDefUuidContext)(survey)
    void ExpressionVariables.getVariables({
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
    }).then((vars) => {
      setVariables(vars)
    })
  }, [
    cycle,
    editorType,
    excludeCurrentNodeDef,
    groupByParent,
    includeAnalysis,
    lang,
    mode,
    nodeDefCurrent,
    nodeDefUuidContext,
    survey,
  ])

  return {
    ...state,
    nodeDefCurrent,
    onApply,
    onChangeTextMode,
    onToggleAdvancedEditor,
    resetDraftQuery,
    updateDraftExpr,
    updateDraftQuery,
    variables,
  }
}
