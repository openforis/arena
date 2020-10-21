import './expressionEditorPopup.scss'

import React, { useState, useRef, useEffect } from 'react'
import PropTypes from 'prop-types'
import CodeMirror from 'codemirror/lib/codemirror'
import 'codemirror/addon/hint/show-hint'

import * as NodeDef from '@core/survey/nodeDef'
import * as Expression from '@core/expressionParser/expression'
import { getExpressionIdentifiers } from '@core/expressionParser/helpers/evaluator'
import { useI18n } from '@webapp/store/system'

import { arenaExpressionHint } from './codemirrorArenaExpressionHint'

const validateExpression = ({ variablesIds, exprString, mode }) => {
  try {
    const expr = Expression.fromString(exprString, mode)
    const ids = getExpressionIdentifiers(expr)
    const unknownIds = ids.filter((id) => !variablesIds.includes(id))

    if (unknownIds.length > 0)
      return { error: 'identifierError', message: `Unknown variable: ${unknownIds.join(', ')}` }

    const canBeConstant = true // Name the param
    return { ok: Expression.isValid(expr, canBeConstant) }
  } catch (error) {
    return { error: 'syntaxError', message: error.message }
  }
}

const AdvancedExpressionEditorPopup = (props) => {
  const { nodeDefCurrent, query, mode, setExpressionCanBeApplied, variables, updateDraftQuery } = props

  const inputRef = useRef()
  const i18n = useI18n()

  const [validation, setValidation] = useState({})

  const variablesOtherNodeDefs = variables.filter((v) => v.uuid !== NodeDef.getUuid(nodeDefCurrent))

  const variablesIds = variablesOtherNodeDefs.map((x) => x.value)

  useEffect(() => {
    const editor = CodeMirror.fromTextArea(inputRef.current, {
      lineNumbers: false,
      autofocus: true,
      extraKeys: { 'Ctrl-Space': 'autocomplete' },
      mode: { name: 'arena-expression' },
      hintOptions: { hint: arenaExpressionHint.bind(null, mode, i18n, variablesOtherNodeDefs) },
    })
    editor.setSize('100%', 'auto')

    editor.setValue(query)

    editor.on('change', (cm) => {
      const value = cm.getValue()
      const valueTrimmed = value.trim()
      const newValidation = valueTrimmed === '' ? {} : validateExpression({ variablesIds, exprString: value, mode })
      setValidation(newValidation)
      setExpressionCanBeApplied(query !== value && !newValidation.error)
      if (!newValidation.error) {
        updateDraftQuery(valueTrimmed)
      }
    })

    return () => editor.toTextArea()
  }, [query, ...variablesIds])

  return (
    <>
      {validation.error ? (
        <div className="expression-editor__query-container">
          <div className="query invalid">{validation.message}</div>
        </div>
      ) : (
        <div style={{ height: '34px' }} />
      )}
      <div className="expression-editor-popup__expr-container">
        <textarea ref={inputRef} />
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
  nodeDefCurrent: PropTypes.object,
  query: PropTypes.string, // String representing the expression
  setExpressionCanBeApplied: PropTypes.func.isRequired,
  updateDraftQuery: PropTypes.func.isRequired,
  variables: PropTypes.arrayOf(Object).isRequired,
  mode: PropTypes.string,
}

AdvancedExpressionEditorPopup.defaultProps = {
  nodeDefCurrent: null,
  query: '',
  mode: Expression.modes.json,
}

export default AdvancedExpressionEditorPopup
