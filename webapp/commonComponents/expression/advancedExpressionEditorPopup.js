import './expressionEditorPopup.scss'

import React, { useState, useRef, useEffect } from 'react'
import { connect } from 'react-redux'

import CodeMirror from 'codemirror/lib/codemirror'
import 'codemirror/addon/hint/show-hint'

import * as Expression from '@core/expressionParser/expression'
import { getExpressionIdentifiers } from '@core/expressionParser/helpers/evaluator'
import { arenaExpressionHint } from './codemirrorArenaExpressionHint'

import { mapStateToProps } from './expressionEditorPopupState'

const functionExamples = {
  min: (
    <>
      <tt>max(3,1,2)</tt> = 1
    </>
  ),
  max: (
    <>
      <tt>max(3,2,1,2)</tt> = 1
    </>
  ),
  pow: (
    <>
      <tt>pow(2,4)</tt> = 2<sup>4</sup> = 16
    </>
  ),
}

const validateExpression = (nodeDefCurrent, variables, exprString) => {
  try {
    const expr = Expression.fromString(exprString)
    const ids = getExpressionIdentifiers(expr)
    const unknownIds = ids.filter(
      id =>
        !variables
          .filter(v => v.value !== nodeDefCurrent.props.name)
          .map(v => v.value)
          .includes(id),
    )

    if (unknownIds.length > 0)
      return { error: 'identifierError', message: `Unknown variable: ${unknownIds.join(', ')}` }

    const canBeConstant = true // Name the param
    return { ok: Expression.isValid(expr, canBeConstant) }
  } catch (error) {
    return { error: 'syntaxError', message: error.message }
  }
}

const CodeMirrorComponent = props => {
  const inputRef = useRef()

  const { nodeDefCurrent, setValidation, setExpressionCanBeApplied, query, updateDraft, variables } = props

  // NB: updateDraft is an unstable dependency so don't use it
  const effectDependencies = [
    nodeDefCurrent,
    setValidation,
    setExpressionCanBeApplied,
    query,
    ...variables.map(x => x.value),
  ]

  useEffect(() => {
    const editor = CodeMirror.fromTextArea(inputRef.current, {
      lineNumbers: false,
      autofocus: true,
      extraKeys: { 'Ctrl-Space': 'autocomplete' },
      mode: { name: 'arena-expression' },
      hintOptions: { hint: arenaExpressionHint.bind(this, variables) },
    })
    editor.setSize('100%', 'auto')

    editor.setValue(query)
    const onChange = cm => {
      const value = cm.getValue()
      const newValidation = value.trim() === '' ? {} : validateExpression(nodeDefCurrent, variables, value)
      setValidation(newValidation)
      setExpressionCanBeApplied(query !== value && !newValidation.error)
      if (!newValidation.error) updateDraft(value.trim())
    }

    editor.on('change', onChange)
    return () => editor.toTextArea()
  }, effectDependencies)

  return <textarea ref={inputRef} />
}

const AdvancedExpressionEditorPopup = props => {
  const [validation, setValidation] = useState({})

  const { nodeDefCurrent, variables, setExpressionCanBeApplied, query, updateDraft } = props

  const variables2 = variables.filter(v => v.value !== nodeDefCurrent.props.name)

  const updateInputProps = {
    nodeDefCurrent,
    variables: variables2,
    setValidation,
    setExpressionCanBeApplied,
    query,
    updateDraft,
  }
  return (
    <div>
      <div className="expression-editor-popup__expr-container" style={{ fontSize: '1rem' }}>
        <CodeMirrorComponent {...updateInputProps} />
      </div>

      <br />

      <div className="expression-editor__query-container">
        <div className={`query${!validation.error ? '' : ' invalid'}`}>{validation.message}</div>
      </div>
    </div>
  )
}

AdvancedExpressionEditorPopup.defaultProps = {
  query: '', // String representing the expression
  // NOTE: One of the two above is passed on component creation
  nodeDefUuidContext: '', // Entity
  nodeDefUuidCurrent: null, // Attribute
  isBoolean: true, // True if expression returns a boolean condition

  onClose: _ => {},
  onChange: _ => {},
}

export default connect(mapStateToProps)(AdvancedExpressionEditorPopup)
