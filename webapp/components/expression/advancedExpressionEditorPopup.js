import './expressionEditorPopup.scss'

import React, { useState, useCallback, useMemo } from 'react'
import ReactCodeMirror from '@uiw/react-codemirror'
import { javascript } from '@codemirror/lang-javascript'
import { autocompletion } from '@codemirror/autocomplete'
import PropTypes from 'prop-types'

import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefExpressionValidator from '@core/survey/nodeDefExpressionValidator'
import * as Expression from '@core/expressionParser/expression'

import { useI18n, useI18nT } from '@webapp/store/system'
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
    textSearchHelpVisible = false,
    updateDraftQuery,
  } = props

  const i18n = useI18n()
  // validation errors can include operators like &&
  const tUnescaped = useI18nT({ unescapeHtml: true })
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
        closeOnBlur: true,
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
    async (value) => {
      const newErrorMessage =
        value === ''
          ? null
          : await NodeDefExpressionValidator.validate({
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
    async (value) => {
      const valueTrimmed = value.trim()
      const valid = await validateEditorValue(valueTrimmed)
      if (valid && valueTrimmed !== query) {
        updateDraftQuery(valueTrimmed)
      }
    },
    [query, updateDraftQuery, validateEditorValue]
  )

  return (
    <>
      <div className="expression-editor__query-container">
        {errorMessage && <div className="query invalid">{tUnescaped(errorMessage.key, errorMessage.params)}</div>}
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
        {/* expressions are always written in JavaScript syntax, also when converted into SQL */}
        <p>{i18n.t(`nodeDefEdit:editorHelp.${Expression.modes.json}`)}</p>
        {textSearchHelpVisible && <p>{i18n.t('nodeDefEdit:editorTextSearchHelp')}</p>}
        <p>
          <kbd>Ctrl</kbd>+<kbd>Space</kbd> {i18n.t('nodeDefEdit:editorCompletionHelp')}
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
  textSearchHelpVisible: PropTypes.bool,
  updateDraftQuery: PropTypes.func.isRequired,
}

export default AdvancedExpressionEditorPopup
