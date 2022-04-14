import './expressionEditorPopup.scss'

import React, { useState, useRef, useEffect } from 'react'
import PropTypes from 'prop-types'
import CodeMirror from 'codemirror/lib/codemirror'
import 'codemirror/addon/hint/show-hint'

import * as A from '@core/arena'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefExpressionValidator from '@core/survey/nodeDefExpressionValidator'
import * as Expression from '@core/expressionParser/expression'

import { useI18n } from '@webapp/store/system'
import { useSurvey } from '@webapp/store/survey'
import { TestId } from '@webapp/utils/testId'

import { arenaExpressionHint } from './codemirrorArenaExpressionHint'

const AdvancedExpressionEditorPopup = function (props) {
  const {
    query,
    mode,
    setExpressionCanBeApplied,
    variables,
    nodeDefCurrent,
    excludeCurrentNodeDef,
    isContextParent,
    updateDraftQuery,
  } = props

  const inputRef = useRef()
  const i18n = useI18n()
  const survey = useSurvey()

  const [errorMessage, setErrorMessage] = useState(null)

  const variablesVisible = excludeCurrentNodeDef
    ? variables
        .filter((variable) => variable.value !== NodeDef.getName(nodeDefCurrent))
        .map((group) => ({
          ...group,
          options: group.options?.filter((variable) => variable.value !== NodeDef.getName(nodeDefCurrent)),
        }))
    : variables

  const variablesIds = variablesVisible
    .map((variable) => (variable.options ? variable.options : [variable]))
    .flatMap(A.prop('value'))

  useEffect(() => {
    const editor = CodeMirror.fromTextArea(inputRef.current, {
      lineNumbers: false,
      autofocus: true,
      extraKeys: { 'Ctrl-Space': 'autocomplete' },
      mode: { name: 'arena-expression' },
      hintOptions: { hint: arenaExpressionHint({ mode, i18n, survey, nodeDefCurrent }) },
    })
    editor.setSize('100%', 'auto')

    editor.setValue(query)

    editor.on('change', (cm) => {
      const exprString = cm.getValue()
      const valueTrimmed = exprString.trim()
      const newErrorMessage =
        valueTrimmed === ''
          ? null
          : NodeDefExpressionValidator.validate({
              survey,
              nodeDefCurrent,
              exprString,
              isContextParent,
              selfReferenceAllowed: !excludeCurrentNodeDef,
            })
      setErrorMessage(newErrorMessage)
      const valid = !newErrorMessage
      setExpressionCanBeApplied(query !== exprString && valid)
      if (valid) {
        updateDraftQuery(valueTrimmed)
      }
    })

    return () => editor.toTextArea()
  }, [query, ...variablesIds])

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
  isContextParent: PropTypes.bool,
  mode: PropTypes.string,
  nodeDefCurrent: PropTypes.object,
  query: PropTypes.string, // String representing the expression
  setExpressionCanBeApplied: PropTypes.func.isRequired,
  updateDraftQuery: PropTypes.func.isRequired,
  variables: PropTypes.arrayOf(Object).isRequired, // variables grouped by parent entity
}

AdvancedExpressionEditorPopup.defaultProps = {
  excludeCurrentNodeDef: true,
  isContextParent: false,
  mode: Expression.modes.json,
  nodeDefCurrent: null,
  query: '',
}

export default AdvancedExpressionEditorPopup
