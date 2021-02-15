import './expressionEditorPopup.scss'

import React, { useState, useRef, useEffect } from 'react'
import PropTypes from 'prop-types'
import CodeMirror from 'codemirror/lib/codemirror'
import 'codemirror/addon/hint/show-hint'

import * as A from '@core/arena'
import * as NodeDef from '@core/survey/nodeDef'
import * as Expression from '@core/expressionParser/expression'
import { getExpressionIdentifiers } from '@core/expressionParser/helpers/evaluator'
import { useI18n } from '@webapp/store/system'

import { arenaExpressionHint } from './codemirrorArenaExpressionHint'

const validateExpression = ({ variablesIds, exprString, mode }) => {
  try {
    const expr = Expression.fromString(exprString, mode)
    const ids = getExpressionIdentifiers(expr)
    const unknownIds = ids.filter((id) => !variablesIds.includes(id) && !Expression.isNodeProperty(id))

    if (unknownIds.length > 0)
      return { error: 'identifierError', message: `Unknown variable: ${unknownIds.join(', ')}` }

    const canBeConstant = true // Name the param
    return { ok: Expression.isValid(expr, canBeConstant) }
  } catch (error) {
    return { error: 'syntaxError', message: error.message }
  }
}

const AdvancedExpressionEditorPopup = (props) => {
  const {
    query,
    mode,
    setExpressionCanBeApplied,
    variables,
    nodeDefCurrent,
    excludeCurrentNodeDef,
    updateDraftQuery,
  } = props

  const inputRef = useRef()
  const i18n = useI18n()

  const [validation, setValidation] = useState({})

  const variablesVisible = excludeCurrentNodeDef
    ? variables.map((group) => ({
        ...group,
        options: group.options.filter((variable) => variable.value !== NodeDef.getName(nodeDefCurrent)),
      }))
    : variables

  const variablesIds = variablesVisible.map(A.prop('options')).flat().map(A.prop('value'))

  useEffect(() => {
    const editor = CodeMirror.fromTextArea(inputRef.current, {
      lineNumbers: false,
      autofocus: true,
      extraKeys: { 'Ctrl-Space': 'autocomplete' },
      mode: { name: 'arena-expression' },
      hintOptions: { hint: arenaExpressionHint.bind(null, mode, i18n, variablesVisible) },
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
  excludeCurrentNodeDef: PropTypes.bool,
  mode: PropTypes.string,
  nodeDefCurrent: PropTypes.object,
  query: PropTypes.string, // String representing the expression
  setExpressionCanBeApplied: PropTypes.func.isRequired,
  updateDraftQuery: PropTypes.func.isRequired,
  variables: PropTypes.arrayOf(Object).isRequired, // variables grouped by parent entity
}

AdvancedExpressionEditorPopup.defaultProps = {
  excludeCurrentNodeDef: true,
  mode: Expression.modes.json,
  nodeDefCurrent: null,
  query: '',
}

export default AdvancedExpressionEditorPopup
