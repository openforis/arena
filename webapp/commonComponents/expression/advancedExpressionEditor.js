import './expressionEditorPopup.scss'

import React, { useState } from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import * as Expression from '@core/expressionParser/expression'
import getCaretCoordinates from 'textarea-caret'
import { getExpressionIdentifiers } from '@core/expressionParser/helpers/evaluator'
import Popup from '../popup'
import { useI18n } from '../hooks'

import { useAdvancedExpressionEditorPopupState, mapStateToProps } from './expressionEditorPopupState'

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

const nonIdRegex = /[^\w_]/
const getWordStart = el => {
  for (let i = el.selectionStart; i >= 0; i--) {
    if (nonIdRegex.test(el.value[i])) return i + 1
  }

  return 0
}

const getWordEnd = el => el.selectionStart

const setAutocompleteList = (i18n, nodeDefCurrent, variables, setPrefix, el) => {
  // We don't support auto-completion for text selections. Too complicated.
  if (el.selectionStart !== el.selectionEnd) return

  const value = el.value.slice(getWordStart(el), getWordEnd(el))

  const variables2 = variables.filter(
    v => v.value !== nodeDefCurrent.props.name && v.value.toLowerCase().startsWith(value.toLowerCase()),
  )

  // NB: this is not a perfect method to detect the boundaries, but it works most of the time.
  // A better version requires diving into the parser and/or using a library for this.
  const validBefore = !/["'\w_)]\s*$/.test(el.value.slice(0, getWordStart(el)))
  const validAfter = !/^\s*["'\w_(]/.test(el.value.slice(getWordEnd(el)))
  const shouldAutocomplete = validBefore && validAfter && variables2.length === 1
  const autocompleteSuggestion = shouldAutocomplete ? variables2[0].value.slice(value.length) : ''

  const getFunctionDescription = fnName => (
    <div style={{ cursor: 'auto' }}>
      {i18n.t(`nodeDefEdit.functionDescriptions.${fnName}`)}: {functionExamples[fnName]}
    </div>
  )

  const functions = Object.keys(functionExamples)
    .filter(name => name.toLowerCase().startsWith(value.toLowerCase()))
    .map(name => ({ name, description: getFunctionDescription(name) }))

  setPrefix({
    autocompleteSuggestion,
    value: el.value,
    variables: variables2,
    functions: validBefore && validAfter && value ? functions : [],
  })
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
    console.error(error)
    return { error: 'syntaxError', message: error.message }
  }
}

const autocompleteCurrentWord = (el, completion) => {
  const v = el.value
  el.value = v.slice(0, getWordStart(el)) + completion + v.slice(getWordEnd(el))
}

const AdvancedExpressionEditorPopup = props => {
  const { nodeDefCurrent, variables, onChange, onClose, revertToBasicMode } = props

  const { query, queryDraft, exprDraft, updateDraft } = useAdvancedExpressionEditorPopupState({
    ...props,
    keepSyntaxFormatting: true,
  })

  const [caret, setCaretPos] = useState({ top: 0, left: 0, right: 0 })
  const [prefix, setPrefix] = useState({
    value: query || queryDraft || '',
    variables: variables.filter(v => v.value !== nodeDefCurrent.props.name),
    autocompleteSuggestion: '',
    functions: [],
  })
  const [validation, setValidation] = useState({})
  const { top, left } = caret

  const i18n = useI18n()

  return (
    <Popup className="expression-editor-popup" onClose={onClose} padding={20}>
      <button onClick={revertToBasicMode} style={{ position: 'absolute', right: 0 }}>
        {i18n.t('nodeDefEdit.expressionsProp.basicMode')}
      </button>

      <div>
        <div className="expression-editor-popup__expr-container" style={{ fontSize: '1rem' }}>
          <textarea
            defaultValue={query}
            style={{
              backgroundColor: 'white',
              minHeight: `${1 + prefix.value.split(/\n/g).length}em`,
              width: '100%',
            }}
            pattern={'^[A-Za-z0-9_ |&=!<>+-*/%]+$'}
            spellCheck={false}
            onKeyDown={e => {
              if (e.key === 'Tab') e.preventDefault() // Always prevent tabbing out

              if (e.key === 'Tab' || e.key === 'Enter') {
                if (prefix.autocompleteSuggestion) {
                  autocompleteCurrentWord(e.target, prefix.variables[0].value)
                  e.preventDefault() // Allow enter to work in non-completion contexts
                }
              }
            }}
            onKeyUp={e => {
              setCaretPos(getCaretCoordinates(e.target, e.target.selectionStart))
              setValidation(
                e.target.value.trim() === '' ? {} : validateExpression(nodeDefCurrent, variables, e.target.value),
              )
              setAutocompleteList(i18n, nodeDefCurrent, variables, setPrefix, e.target)
              updateDraft(e.target.value.trim())
            }}
          />
          <span
            hidden={!prefix.autocompleteSuggestion}
            style={{
              position: 'absolute',
              top: top - 2, // A mysterious discrepancy
              left,
              color: 'grey',
              textDecorationStyle: 'dashed',
            }}
          >
            {prefix.autocompleteSuggestion}
            {prefix.variables.length > 0 &&
              prefix.variables[0].label &&
              prefix.variables[0].label !== prefix.variables[0].value && (
                <div style={{ backgroundColor: 'white', borderColor: 'grey' }}>
                  <br />
                  {prefix.variables[0].label}
                </div>
              )}
          </span>
        </div>
        <div>
          <ul style={{ listStyle: 'none' }}>
            {prefix.functions.map((x, i) => (
              <li key={i} onClick={() => autocompleteCurrentWord(x.value, x)} cursor={'pointer'}>
                <span>{x.name}</span>
                <span style={{ float: 'right' }}>{x.description}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="expression-editor__query-container">
          <div className={`query${!validation.error ? '' : ' invalid'}`}>{validation.message}</div>
        </div>
      </div>

      <div className="expression-editor-popup__footer">
        <button className="btn btn-xs" onClick={() => onChange('')} aria-disabled={R.isEmpty(query)}>
          <span className="icon icon-undo2 icon-12px" />
          {i18n.t('common.reset')}
        </button>

        {/*
        By adding a newline to all onChange() params, we specify that
        the query was written with this advanced expression editor.
        With this, we can always open the query (i.e. the expression)
        in advanced editor directly.
        */}
        <button
          className="btn btn-xs"
          onClick={() => onChange(queryDraft.trimRight() + '\n', exprDraft)}
          aria-disabled={query === queryDraft || !validation.ok}
        >
          <span className="icon icon-checkmark icon-12px" />
          {i18n.t('common.apply')}
        </button>
      </div>
    </Popup>
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
