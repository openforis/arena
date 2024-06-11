import './expressionEditorPopup.scss'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import PropTypes from 'prop-types'
import CodeMirror from 'codemirror/lib/codemirror'
import 'codemirror/addon/hint/show-hint'

import * as NodeDefExpressionValidator from '@core/survey/nodeDefExpressionValidator'
import * as Expression from '@core/expressionParser/expression'

import { useI18n } from '@webapp/store/system'
import { useSurvey, useSurveyCycleKey } from '@webapp/store/survey'
import { TestId } from '@webapp/utils/testId'

import { arenaExpressionHint } from './codemirrorArenaExpressionHint'

const AdvancedExpressionEditorPopup = (props) => {
  const { query, mode, nodeDefCurrent, excludeCurrentNodeDef, includeAnalysis, isContextParent, updateDraftQuery } =
    props

  const inputRef = useRef()
  const i18n = useI18n()
  const survey = useSurvey()
  const cycle = useSurveyCycleKey()

  const [errorMessage, setErrorMessage] = useState(null)
  const editorRef = useRef(null)

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
    [excludeCurrentNodeDef, isContextParent, nodeDefCurrent, survey]
  )

  const onEditorChange = useCallback(
    (cm) => {
      const value = cm.getValue()
      const valueTrimmed = value.trim()

      const valid = validateEditorValue(valueTrimmed)

      if (valid && valueTrimmed !== query) {
        updateDraftQuery(valueTrimmed)
      }
    },
    [query, updateDraftQuery, validateEditorValue]
  )

  // initialize CodeMirror text area
  useEffect(() => {
    const editor = CodeMirror.fromTextArea(inputRef.current, {
      lineNumbers: false,
      autofocus: true,
      extraKeys: { 'Ctrl-Space': 'autocomplete' },
      mode: { name: 'arena-expression' },
      hintOptions: {
        hint: arenaExpressionHint({ mode, i18n, survey, cycle, nodeDefCurrent, isContextParent, includeAnalysis }),
      },
    })
    editor.setSize('100%', 'auto')

    editor.on('change', onEditorChange)

    editorRef.current = editor

    return () => editor.toTextArea()
  }, [])

  // handle query prop change
  useEffect(() => {
    const editor = editorRef.current
    if (editor.getValue() !== query) {
      editor.setValue(query)
    }
  }, [query])

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
        <textarea data-testid={TestId.expressionEditor.advancedQuery} ref={inputRef} />
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

AdvancedExpressionEditorPopup.defaultProps = {
  excludeCurrentNodeDef: true,
  includeAnalysis: false,
  isContextParent: false,
  mode: Expression.modes.json,
  nodeDefCurrent: null,
  query: '',
}

export default AdvancedExpressionEditorPopup
