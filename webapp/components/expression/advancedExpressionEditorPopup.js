import './expressionEditorPopup.scss'

import React, { useState, useCallback } from 'react'
import { javascript } from '@codemirror/lang-javascript'
import { autocompletion, completeFromList } from '@codemirror/autocomplete'
import PropTypes from 'prop-types'

import * as NodeDefExpressionValidator from '@core/survey/nodeDefExpressionValidator'
import * as Expression from '@core/expressionParser/expression'

import { useI18n } from '@webapp/store/system'
import { useSurvey, useSurveyCycleKey } from '@webapp/store/survey'
import { TestId } from '@webapp/utils/testId'
import ReactCodeMirror, { EditorView } from '@uiw/react-codemirror'
import { codemirrorArenaCompletions } from './codemirrorArenaCompletions'

// import { arenaExpressionHint } from './codemirrorArenaExpressionHint'

const completionsCompareFn = (contextUuid) => (completionA, completionB) => {
  const { apply: applyA, label: labelA, parentUuid: parentUuidA, type: typeA } = completionA
  const { apply: applyB, label: labelB, parentUuid: parentUuidB, type: typeB } = completionB
  const typeComparison = typeB.localeCompare(typeA)
  if (typeComparison === 0 && typeA === 'variable') {
    if (applyA === Expression.thisVariable) return -1
    if (applyB === Expression.thisVariable) return 1
    if (parentUuidA !== parentUuidB) {
      if (parentUuidA === contextUuid) return -1
      if (parentUuidB === contextUuid) return 1
    }
  }
  return typeComparison || labelA.localeCompare(labelB)
}

const AdvancedExpressionEditorPopup = (props) => {
  const {
    excludeCurrentNodeDef = true,
    includeAnalysis = false,
    isContextParent = false,
    mode = Expression.modes.json,
    nodeDefCurrent = null,
    query = '',
    updateDraftQuery,
  } = props

  const i18n = useI18n()
  const survey = useSurvey()
  const cycle = useSurveyCycleKey()

  const [errorMessage, setErrorMessage] = useState(null)

  const extensions = [
    javascript(),
    autocompletion({
      compareCompletions: completionsCompareFn(nodeDefCurrent?.parentUuid),
      override: [
        completeFromList(
          codemirrorArenaCompletions({ mode, i18n, survey, cycle, nodeDefCurrent, isContextParent, includeAnalysis })
        ),
      ],
      tooltipClass: () => 'codemirror-arena-autocomplete',
    }),
    EditorView.updateListener.of(updateList), // using update listener to check if user has pressed a dot (to explicitly provide completions)
  ]

  // update listener to check if user has typed a dot
  function updateList(args) {
    let change = args?.changes?.inserted[1]?.text[0]
    // let changes = args?.changes?.sections[0]
    // console.log({ change, changes })
    if (change == '.') {
      // startCompletion(editor)
    }
  }

  const validateEditorValue = useCallback(
    (value) => {
      const newErrorMessage =
        value === ''
          ? null
          : NodeDefExpressionValidator.validate({
              survey,
              nodeDefCurrent,
              exprString: value,
              isContextParent,
              selfReferenceAllowed: !excludeCurrentNodeDef,
              includeAnalysis,
            })
      setErrorMessage(newErrorMessage)
      const valid = !newErrorMessage
      return valid
    },
    [excludeCurrentNodeDef, includeAnalysis, isContextParent, nodeDefCurrent, survey]
  )

  const onEditorChange = useCallback(
    (value) => {
      const valueTrimmed = value.trim()
      const valid = validateEditorValue(valueTrimmed)
      if (valid && valueTrimmed !== query) {
        updateDraftQuery(valueTrimmed)
      }
    },
    [query, updateDraftQuery, validateEditorValue]
  )

  return (
    <>
      {errorMessage ? (
        <div className="expression-editor__query-container">
          <div className="query invalid">{i18n.t(errorMessage.key, errorMessage.params)}</div>
        </div>
      ) : (
        <div style={{ height: '34px' }} />
      )}
      <div className="expression-editor-popup__expr-container">
        {/*<textarea data-testid={TestId.expressionEditor.advancedQuery} ref={inputRef} />*/}
        <ReactCodeMirror value={query} extensions={extensions} onChange={onEditorChange} />
      </div>
      <div className="expression-editor-popup__editor-help">
        <p>{i18n.t(`nodeDefEdit.editorHelp.${mode}`)}</p>
        <p>
          <kbd>Ctrl</kbd>+<kbd>Space</kbd> {i18n.t('nodeDefEdit.editorCompletionHelp')}
        </p>
      </div>
    </>
  )
}

AdvancedExpressionEditorPopup.propTypes = {
  excludeCurrentNodeDef: PropTypes.bool,
  includeAnalysis: PropTypes.bool,
  isContextParent: PropTypes.bool,
  mode: PropTypes.string,
  nodeDefCurrent: PropTypes.object,
  query: PropTypes.string, // String representing the expression
  updateDraftQuery: PropTypes.func.isRequired,
}

export default AdvancedExpressionEditorPopup
