import './expressionEditorPopup.scss'

import React, { useState, useCallback, useMemo } from 'react'
import ReactCodeMirror from '@uiw/react-codemirror'
import { javascript } from '@codemirror/lang-javascript'
import { autocompletion } from '@codemirror/autocomplete'
import PropTypes from 'prop-types'

import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefExpressionValidator from '@core/survey/nodeDefExpressionValidator'
import * as Expression from '@core/expressionParser/expression'

import { useI18n } from '@webapp/store/system'
import { useSurvey } from '@webapp/store/survey'

import { useAutocompletionSource } from './useAutocompletionSource'

const codeMirrorBasicSetup = { foldGutter: false, lineNumbers: false }

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
  const nodeDefCurrentParentUuid = NodeDef.getParentUuid(nodeDefCurrent)

  const [errorMessage, setErrorMessage] = useState(null)

  const autocompletionSource = useAutocompletionSource({
    mode,
    nodeDefCurrent,
    isContextParent,
    includeAnalysis,
  })

  const codeMirrorExtensions = useMemo(
    () => [
      javascript(),
      autocompletion({
        closeOnBlur: false,
        // add a carriage return after the label in the rendered item option
        addToOptions: [
          {
            render: () => document.createElement('br'),
            position: 60,
          },
        ],
        compareCompletions: completionsCompareFn(nodeDefCurrentParentUuid),
        override: [autocompletionSource],
        optionClass: (completion) => `cm-completion-option ${completion.type}`,
      }),
    ],
    [autocompletionSource, nodeDefCurrentParentUuid]
  )

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
      <div className="expression-editor__query-container">
        {errorMessage && <div className="query invalid">{i18n.t(errorMessage.key, errorMessage.params)}</div>}
      </div>
      <div className="expression-editor-popup__expr-container">
        <ReactCodeMirror
          autoFocus
          basicSetup={codeMirrorBasicSetup}
          extensions={codeMirrorExtensions}
          onChange={onEditorChange}
          value={query}
        />
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
